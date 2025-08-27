let currentCategory = 'all';
let isAdmin = false;
let events = JSON.parse(localStorage.getItem('events')) || [];
let currentEventId = null;
let calendar;
let notificationsSent = JSON.parse(localStorage.getItem('notificationsSent')) || {};

document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                console.warn('Notification permission not granted');
            }
        });
    }

    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'th',
        validRange: {
            start: '2010-01-01',
            end: '2031-01-01'
        },
        eventColor: 'red',
        events: function(fetchInfo, successCallback, failureCallback) {
            let filtered = events;
            if (currentCategory !== 'all') {
                filtered = events.filter(ev => ev.extendedProps.category === currentCategory);
            }
            successCallback(filtered);
        },
        eventClick: function(info) {
            showModal(info.event);
        }
    });
    calendar.render();

    // Menu buttons
    document.getElementById('all-btn').addEventListener('click', () => {
        currentCategory = 'all';
        document.getElementById('calendar-section').style.display = 'none';
        document.getElementById('event-list').style.display = 'block';
        document.getElementById('add-event').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('edit-event').style.display = 'none';
        renderEventList();
    });
    document.getElementById('department-btn').addEventListener('click', () => {
        currentCategory = 'department';
        document.getElementById('calendar-section').style.display = 'none';
        document.getElementById('event-list').style.display = 'block';
        document.getElementById('add-event').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('edit-event').style.display = 'none';
        renderEventList();
    });
    document.getElementById('college-btn').addEventListener('click', () => {
        currentCategory = 'college';
        document.getElementById('calendar-section').style.display = 'none';
        document.getElementById('event-list').style.display = 'block';
        document.getElementById('add-event').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('edit-event').style.display = 'none';
        renderEventList();
    });

    // Back to calendar button
    document.getElementById('back-to-calendar').addEventListener('click', () => {
        document.getElementById('calendar-section').style.display = 'block';
        document.getElementById('event-list').style.display = 'none';
        document.getElementById('add-event').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('edit-event').style.display = 'none';
        calendar.refetchEvents();
    });

    // Login button
    document.getElementById('login-btn').addEventListener('click', () => {
        const password = prompt('กรุณาใส่รหัสผ่านแอดมิน:');
        if (password === 'admin123') {
            isAdmin = true;
            document.getElementById('add-event').style.display = 'block';
            alert('เข้าสู่ระบบสำเร็จ');
        } else {
            alert('รหัสผ่านไม่ถูกต้อง');
        }
    });

    // Form submit for adding events
    document.getElementById('event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isAdmin) return;

        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const location = document.getElementById('location').value;
        const category = document.getElementById('category').value;

        const start = date + 'T' + startTime + ':00';
        const end = date + 'T' + endTime + ':00';

        const eventId = Date.now().toString();
        events.push({
            id: eventId,
            title: title,
            start: start,
            end: end,
            extendedProps: {
                location: location,
                category: category,
                startTime: startTime,
                endTime: endTime
            }
        });

        // Reset notifications for new event
        delete notificationsSent[eventId];
        localStorage.setItem('events', JSON.stringify(events));
        localStorage.setItem('notificationsSent', JSON.stringify(notificationsSent));
        calendar.refetchEvents();
        renderEventList();
        this.reset();
    });

    // Form submit for editing events
    document.getElementById('edit-event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (!isAdmin) return;

        const eventId = document.getElementById('edit-event-id').value;
        const title = document.getElementById('edit-title').value;
        const date = document.getElementById('edit-date').value;
        const startTime = document.getElementById('edit-start-time').value;
        const endTime = document.getElementById('edit-end-time').value;
        const location = document.getElementById('edit-location').value;
        const category = document.getElementById('edit-category').value;

        const start = date + 'T' + startTime + ':00';
        const end = date + 'T' + endTime + ':00';

        events = events.map(ev => {
            if (ev.id === eventId) {
                // Reset notifications for edited event
                delete notificationsSent[eventId];
                return {
                    id: ev.id,
                    title: title,
                    start: start,
                    end: end,
                    extendedProps: {
                        location: location,
                        category: category,
                        startTime: startTime,
                        endTime: endTime
                    }
                };
            }
            return ev;
        });

        localStorage.setItem('events', JSON.stringify(events));
        localStorage.setItem('notificationsSent', JSON.stringify(notificationsSent));
        calendar.refetchEvents();
        renderEventList();
        document.getElementById('edit-event').style.display = 'none';
        document.getElementById('event-modal').style.display = 'none';
    });

    // Cancel edit button
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-event').style.display = 'none';
        document.getElementById('event-modal').style.display = 'block';
    });

    // Edit button
    document.getElementById('edit-btn').addEventListener('click', () => {
        const event = events.find(ev => ev.id === currentEventId);
        if (!event) return;

        document.getElementById('edit-event-id').value = event.id;
        document.getElementById('edit-title').value = event.title;
        document.getElementById('edit-date').value = event.start.split('T')[0];
        document.getElementById('edit-start-time').value = event.extendedProps.startTime;
        document.getElementById('edit-end-time').value = event.extendedProps.endTime;
        document.getElementById('edit-location').value = event.extendedProps.location;
        document.getElementById('edit-category').value = event.extendedProps.category;

        document.getElementById('event-modal').style.display = 'none';
        document.getElementById('edit-event').style.display = 'block';
    });

    // Delete button
    document.getElementById('delete-btn').addEventListener('click', () => {
        if (!isAdmin) return;
        if (confirm('คุณต้องการลบกิจกรรมนี้หรือไม่?')) {
            events = events.filter(ev => ev.id !== currentEventId);
            delete notificationsSent[currentEventId];
            localStorage.setItem('events', JSON.stringify(events));
            localStorage.setItem('notificationsSent', JSON.stringify(notificationsSent));
            calendar.refetchEvents();
            renderEventList();
            document.getElementById('event-modal').style.display = 'none';
        }
    });

    // Modal
    const modal = document.getElementById('event-modal');
    const span = document.getElementsByClassName('close')[0];
    span.onclick = function() {
        modal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Notification checker
    setInterval(() => {
        const now = new Date();
        events.forEach(ev => {
            const eventDate = new Date(ev.start);
            const eventId = ev.id;

            // One day before notification
            const oneDayBefore = new Date(eventDate);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);
            oneDayBefore.setHours(0, 0, 0, 0); // Start of the day
            const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (
                nowStartOfDay.getTime() === oneDayBefore.getTime() &&
                Notification.permission === 'granted' &&
                (!notificationsSent[eventId] || !notificationsSent[eventId].oneDay)
            ) {
                new Notification('แจ้งเตือนกิจกรรม', {
                    body: `พรุ่งนี้มีกิจกรรม: ${ev.title} ที่ ${ev.extendedProps.location} เวลา ${ev.extendedProps.startTime}น. - ${ev.extendedProps.endTime}น.`
                });
                notificationsSent[eventId] = notificationsSent[eventId] || {};
                notificationsSent[eventId].oneDay = true;
                localStorage.setItem('notificationsSent', JSON.stringify(notificationsSent));
            }

            // One hour before notification
            const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
            if (
                now >= oneHourBefore &&
                now < eventDate &&
                Notification.permission === 'granted' &&
                (!notificationsSent[eventId] || !notificationsSent[eventId].oneHour)
            ) {
                new Notification('แจ้งเตือนกิจกรรม', {
                    body: `อีก 1 ชั่วโมงจะเริ่มกิจกรรม: ${ev.title} ที่ ${ev.extendedProps.location} เวลา ${ev.extendedProps.startTime}น.`
                });
                notificationsSent[eventId] = notificationsSent[eventId] || {};
                notificationsSent[eventId].oneHour = true;
                localStorage.setItem('notificationsSent', JSON.stringify(notificationsSent));
            }
        });
    }, 60000); // Check every minute
});

function renderEventList() {
    const eventList = document.getElementById('event-list');
    eventList.innerHTML = '';

    let filteredEvents = events;
    if (currentCategory !== 'all') {
        filteredEvents = events.filter(ev => ev.extendedProps.category === currentCategory);
    }

    // Sort events by start date ascending
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Group by date
    const groups = {};
    filteredEvents.forEach(ev => {
        const dateKey = new Date(ev.start).toLocaleDateString('th-TH');
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(ev);
    });

    for (const date in groups) {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'day-block';
        const h3 = document.createElement('h3');
        h3.textContent = `วันที่: ${date}`;
        dayBlock.appendChild(h3);

        groups[date].forEach(ev => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = `
                <h4>${ev.title}</h4>
                <p>เวลา: ${ev.extendedProps.startTime}น. - ${ev.extendedProps.endTime}น.</p>
                <p>สถานที่: ${ev.extendedProps.location}</p>
                ${new Date(ev.end) < new Date() ? '<p style="color: red; font-weight: bold;">กิจกรรมนี้จัดเรียบร้อยแล้ว</p>' : ''}
            `;
            eventItem.onclick = () => showModal(ev);
            dayBlock.appendChild(eventItem);
        });

        eventList.appendChild(dayBlock);
    }
}

function showModal(ev) {
    const modal = document.getElementById('event-modal');
    document.getElementById('modal-title').textContent = ev.title;
    document.getElementById('modal-date').textContent = 'วันที่: ' + new Date(ev.start).toLocaleDateString('th-TH');
    document.getElementById('modal-time').textContent = 'เวลา: ' + ev.extendedProps.startTime + 'น. - ' + ev.extendedProps.endTime + 'น.';
    document.getElementById('modal-location').textContent = 'สถานที่: ' + ev.extendedProps.location;

    const status = document.getElementById('modal-status');
    if (new Date(ev.end) < new Date()) {
        status.textContent = 'กิจกรรมนี้จัดเรียบร้อยแล้ว';
        status.style.display = 'block';
    } else {
        status.style.display = 'none';
    }

    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    if (isAdmin) {
        editBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
        currentEventId = ev.id;
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}