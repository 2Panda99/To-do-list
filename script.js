// Global state
let tasks = JSON.parse(localStorage.getItem('studyhub_tasks') || '[]')
let sessions = JSON.parse(localStorage.getItem('studyhub_sessions') || '[]')
let settings = JSON.parse(
  localStorage.getItem('studyhub_settings') ||
    '{"theme": "light", "focusDuration": 25}'
)

let timerInterval = null
let timerSeconds = settings.focusDuration * 60
let isTimerRunning = false
let currentDate = new Date()



// Initialize app
document.addEventListener('DOMContentLoaded', function () {
  loadTheme()
  updateStats()
  renderTasks()
  renderSessions()
  renderCalendar()
  renderCharts()
  updateTimerDisplay()
})



// Navigation
function showPage (pageId) {
  document
    .querySelectorAll('.page')
    .forEach(page => page.classList.remove('active'))
  document
    .querySelectorAll('.nav-links a')
    .forEach(link => link.classList.remove('active'))

  document.getElementById(pageId).classList.add('active')
  event.target.classList.add('active')

  if (pageId === 'reports') {
    setTimeout(renderCharts, 100) // Delay for proper canvas rendering
  }
}



// Theme management
function toggleTheme () {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

function setTheme (theme) {
  document.documentElement.setAttribute('data-theme', theme)
  settings.theme = theme
  saveSettings()

  // Update radio buttons
  document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true

  // Update theme toggle button
  document.querySelector('.theme-toggle').textContent =
    theme === 'dark' ? '☀️' : '🌙'
}

function loadTheme () {
  setTheme(settings.theme)
}



// Task management
function addTask (event) {
  event.preventDefault()

  const taskInput = document.getElementById('taskInput')
  const taskSubject = document.getElementById('taskSubject')
  const taskPriority = document.getElementById('taskPriority')
  const taskDue = document.getElementById('taskDue')

  const task = {
    id: Date.now(),
    text: taskInput.value,
    subject: taskSubject.value,
    priority: taskPriority.value,
    due: taskDue.value,
    completed: false,
    createdAt: new Date().toISOString()
  }

  tasks.push(task)
  saveTasks()
  renderTasks()
  updateStats()

  // Reset form
  taskInput.value = ''
  taskDue.value = ''
}

function toggleTask (taskId) {
  const task = tasks.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    task.completedAt = task.completed ? new Date().toISOString() : null
    saveTasks()
    renderTasks()
    updateStats()
  }
}

function deleteTask (taskId) {
  tasks = tasks.filter(t => t.id !== taskId)
  saveTasks()
  renderTasks()
  updateStats()
}

function renderTasks () {
  const taskList = document.getElementById('taskList')
  taskList.innerHTML = ''

  // Sort tasks: incomplete first, then by priority, then by due date
  const sortedTasks = tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed - b.completed

    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }

    if (a.due && b.due) return new Date(a.due) - new Date(b.due)
    return 0
  })

  sortedTasks.forEach(task => {
    const li = document.createElement('li')
    li.className = `task-item ${task.completed ? 'completed' : ''} fade-in`

    const dueDate = task.due ? new Date(task.due) : null
    const isOverdue = dueDate && dueDate < new Date() && !task.completed
    const daysUntilDue = dueDate
      ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
      : null

    li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${
                      task.completed ? 'checked' : ''
                    } 
                           onchange="toggleTask(${task.id})">
                    <span class="task-text">${task.text}</span>
                    <span class="task-subject subject-${task.subject}">${
      task.subject
    }</span>
                    <span class="task-priority priority-${task.priority}">${
      task.priority
    }</span>
                    ${
                      task.due
                        ? `<span class="task-due ${
                            isOverdue ? 'text-danger' : ''
                          }">${
                            isOverdue
                              ? 'Overdue!'
                              : daysUntilDue === 0
                              ? 'Due today'
                              : daysUntilDue === 1
                              ? 'Due tomorrow'
                              : `${daysUntilDue} days`
                          }</span>`
                        : ''
                    }
                    <div class="task-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteTask(${
                          task.id
                        })">Delete</button>
                    </div>
                `

    taskList.appendChild(li)
  })
}




// Timer functionality
function startTimer () {
  if (!isTimerRunning) {
    isTimerRunning = true
    timerInterval = setInterval(() => {
      timerSeconds--
      updateTimerDisplay()

      if (timerSeconds <= 0) {
        completeSession()
      }
    }, 1000)

    document.getElementById('startBtn').textContent = 'Running...'
    document.getElementById('startBtn').disabled = true
  }
}

function pauseTimer () {
  if (isTimerRunning) {
    isTimerRunning = false
    clearInterval(timerInterval)
    document.getElementById('startBtn').textContent = 'Resume'
    document.getElementById('startBtn').disabled = false
  }
}

function resetTimer () {
  isTimerRunning = false
  clearInterval(timerInterval)
  timerSeconds = settings.focusDuration * 60
  updateTimerDisplay()
  document.getElementById('startBtn').textContent = 'Start'
  document.getElementById('startBtn').disabled = false
}

function updateTimerDisplay () {
  const minutes = Math.floor(timerSeconds / 60)
  const seconds = timerSeconds % 60
  document.getElementById('timerDisplay').textContent = `${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function completeSession () {
  resetTimer()

  const session = {
    id: Date.now(),
    duration: settings.focusDuration,
    completedAt: new Date().toISOString(),
    linkedTask: document.getElementById('linkToTask').checked
      ? tasks.find(t => !t.completed)?.id
      : null
  }

  sessions.push(session)
  saveSessions()
  renderSessions()
  updateStats()

  // Show completion notification
  alert(
    `🎉 Great job! You completed a ${settings.focusDuration}-minute focus session!`
  )
}

function renderSessions () {
  const sessionList = document.getElementById('sessionList')
  const todaySessions = sessions
    .filter(s => {
      const sessionDate = new Date(s.completedAt)
      const today = new Date()
      return sessionDate.toDateString() === today.toDateString()
    })
    .slice(-5) // Show last 5 sessions

  sessionList.innerHTML = todaySessions
    .map(session => {
      const time = new Date(session.completedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
      const linkedTask = session.linkedTask
        ? tasks.find(t => t.id === session.linkedTask)?.text || 'Deleted task'
        : 'General study'

      return `
                    <div class="session-item">
                        <span>${time} - ${session.duration}min</span>
                        <span>${linkedTask}</span>
                    </div>
                `
    })
    .join('')
}



// Calendar functionality
function renderCalendar () {
  const calendar = document.getElementById('calendar')
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  document.getElementById('currentMonth').textContent = new Date(
    year,
    month
  ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  calendar.innerHTML = ''

  // Add headers
  const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  headers.forEach(header => {
    const div = document.createElement('div')
    div.className = 'calendar-header'
    div.textContent = header
    calendar.appendChild(div)
  })

  // Add days
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const div = document.createElement('div')
    div.className = 'calendar-day'

    const isCurrentMonth = date.getMonth() === month
    const isToday = date.toDateString() === new Date().toDateString()
    const dayTasks = tasks.filter(
      task =>
        task.due && new Date(task.due).toDateString() === date.toDateString()
    )

    if (!isCurrentMonth) div.style.opacity = '0.3'
    if (isToday) div.classList.add('today')
    if (dayTasks.length > 0) div.classList.add('has-tasks')

    div.innerHTML = `
                    <div class="day-number">${date.getDate()}</div>
                    <div class="day-tasks">${dayTasks.length} task${
      dayTasks.length !== 1 ? 's' : ''
    }</div>
                `

    div.onclick = () => showDayDetails(date, dayTasks)
    calendar.appendChild(div)
  }
}

function changeMonth (direction) {
  currentDate.setMonth(currentDate.getMonth() + direction)
  renderCalendar()
}

function showDayDetails (date, dayTasks) {
  const modal = document.getElementById('dayModal')
  const title = document.getElementById('dayModalTitle')
  const content = document.getElementById('dayModalContent')

  title.textContent = `Tasks for ${date.toLocaleDateString()}`

  if (dayTasks.length === 0) {
    content.innerHTML = '<p>No tasks scheduled for this day.</p>'
  } else {
    content.innerHTML = dayTasks
      .map(
        task => `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <span class="task-text">${task.text}</span>
                        <span class="task-subject subject-${task.subject}">${
          task.subject
        }</span>
                        <span class="task-priority priority-${task.priority}">${
          task.priority
        }</span>
                    </div>
                `
      )
      .join('')
  }

  modal.classList.add('active')
}



// Statistics and charts
function updateStats () {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.completedAt)
    const today = new Date()
    return sessionDate.toDateString() === today.toDateString()
  })
  const focusTime = todaySessions.reduce((total, s) => total + s.duration, 0)

  // Calculate streak (simplified)
  const streak = calculateStreak()

  document.getElementById('totalTasks').textContent = totalTasks
  document.getElementById('completedTasks').textContent = completedTasks
  document.getElementById('focusTime').textContent = `${Math.floor(
    focusTime / 60
  )}h ${focusTime % 60}m`
  document.getElementById('streakDays').textContent = streak

  // Update subject stats
  updateSubjectStats()
}

function calculateStreak () {
  // Simplified streak calculation - days with completed tasks
  const today = new Date()
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    const hasActivity =
      tasks.some(
        task =>
          task.completed &&
          task.completedAt &&
          new Date(task.completedAt).toDateString() === checkDate.toDateString()
      ) ||
      sessions.some(
        session =>
          new Date(session.completedAt).toDateString() ===
          checkDate.toDateString()
      )

    if (hasActivity) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

function updateSubjectStats () {
  const subjectStats = document.getElementById('subjectStats')
  const subjects = ['math', 'science', 'english', 'history']

  subjectStats.innerHTML = subjects
    .map(subject => {
      const subjectTasks = tasks.filter(t => t.subject === subject)
      const completed = subjectTasks.filter(t => t.completed).length
      const total = subjectTasks.length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

      return `
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span class="task-subject subject-${subject}">${
        subject.charAt(0).toUpperCase() + subject.slice(1)
      }</span>
                            <span>${completed}/${total} (${percentage}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `
    })
    .join('')
}

function renderCharts () {
  // Productivity chart (last 7 days)
  const productivityCtx = document.getElementById('productivityChart')
  if (productivityCtx) {
    const last7Days = []
    const focusData = []
    const taskData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }))

      const dayFocus = sessions
        .filter(
          s => new Date(s.completedAt).toDateString() === date.toDateString()
        )
        .reduce((total, s) => total + s.duration, 0)
      focusData.push(dayFocus)

      const dayTasks = tasks.filter(
        t =>
          t.completed &&
          t.completedAt &&
          new Date(t.completedAt).toDateString() === date.toDateString()
      ).length
      taskData.push(dayTasks)
    }

    new Chart(productivityCtx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [
          {
            label: 'Focus Time (minutes)',
            data: focusData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4
          },
          {
            label: 'Tasks Completed',
            data: taskData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  // Subject distribution chart
  const subjectCtx = document.getElementById('subjectChart')
  if (subjectCtx) {
    const subjects = ['math', 'science', 'english', 'history']
    const subjectData = subjects.map(
      subject => tasks.filter(t => t.subject === subject && t.completed).length
    )

    new Chart(subjectCtx, {
      type: 'doughnut',
      data: {
        labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [
          {
            data: subjectData,
            backgroundColor: ['#7c3aed', '#16a34a', '#d97706', '#dc2626']
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  }
}



// Templates
function showTemplates () {
  document.getElementById('templateModal').classList.add('active')
}

function loadTemplate (templateType) {
  const templates = {
    exam: [
      { text: 'Review chapter notes', subject: 'math', priority: 'high' },
      { text: 'Complete practice problems', subject: 'math', priority: 'high' },
      { text: 'Create study guide', subject: 'math', priority: 'medium' },
      { text: 'Schedule study group', subject: 'math', priority: 'low' }
    ],
    project: [
      { text: 'Research topic', subject: 'english', priority: 'high' },
      { text: 'Create outline', subject: 'english', priority: 'high' },
      { text: 'Write first draft', subject: 'english', priority: 'medium' },
      { text: 'Review and edit', subject: 'english', priority: 'medium' },
      { text: 'Final submission', subject: 'english', priority: 'high' }
    ],
    daily: [
      {
        text: "Review yesterday's notes",
        subject: 'science',
        priority: 'medium'
      },
      {
        text: 'Complete homework assignments',
        subject: 'math',
        priority: 'high'
      },
      {
        text: 'Read assigned chapters',
        subject: 'history',
        priority: 'medium'
      },
      { text: 'Practice vocabulary', subject: 'english', priority: 'low' }
    ]
  }

  const templateTasks = templates[templateType] || []
  templateTasks.forEach(template => {
    const task = {
      id: Date.now() + Math.random(),
      text: template.text,
      subject: template.subject,
      priority: template.priority,
      due: '',
      completed: false,
      createdAt: new Date().toISOString()
    }
    tasks.push(task)
  })

  saveTasks()
  renderTasks()
  updateStats()
  closeModal('templateModal')
}



// Export functionality
function exportReport () {
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weeklyTasks = tasks.filter(t => new Date(t.createdAt) >= weekAgo)
  const weeklySessions = sessions.filter(
    s => new Date(s.completedAt) >= weekAgo
  )

  const report = `
StudyHub Pro - Weekly Report
Generated: ${today.toLocaleDateString()}

TASK SUMMARY
============
Total tasks created: ${weeklyTasks.length}
Tasks completed: ${weeklyTasks.filter(t => t.completed).length}
Completion rate: ${
    weeklyTasks.length > 0
      ? Math.round(
          (weeklyTasks.filter(t => t.completed).length / weeklyTasks.length) *
            100
        )
      : 0
  }%

FOCUS SESSIONS
==============
Total sessions: ${weeklySessions.length}
Total focus time: ${weeklySessions.reduce(
    (total, s) => total + s.duration,
    0
  )} minutes
Average session: ${
    weeklySessions.length > 0
      ? Math.round(
          weeklySessions.reduce((total, s) => total + s.duration, 0) /
            weeklySessions.length
        )
      : 0
  } minutes

SUBJECT BREAKDOWN
=================
${['math', 'science', 'english', 'history']
  .map(subject => {
    const subjectTasks = weeklyTasks.filter(t => t.subject === subject)
    const completed = subjectTasks.filter(t => t.completed).length
    return `${
      subject.charAt(0).toUpperCase() + subject.slice(1)
    }: ${completed}/${subjectTasks.length} completed`
  })
  .join('\n')}

COMPLETED TASKS
===============
${weeklyTasks
  .filter(t => t.completed)
  .map(t => `✓ ${t.text} (${t.subject}, ${t.priority} priority)`)
  .join('\n')}

PENDING TASKS
=============
${weeklyTasks
  .filter(t => !t.completed)
  .map(
    t =>
      `○ ${t.text} (${t.subject}, ${t.priority} priority)${
        t.due ? ` - Due: ${t.due}` : ''
      }`
  )
  .join('\n')}
            `.trim()

  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StudyHub-Report-${today.toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}



// Settings
function updateFocusDuration () {
  const duration = parseInt(document.getElementById('focusDuration').value)
  settings.focusDuration = duration
  saveSettings()
  resetTimer()
}

function clearAllData () {
  if (
    confirm('Are you sure you want to clear all data? This cannot be undone.')
  ) {
    tasks = []
    sessions = []
    localStorage.removeItem('studyhub_tasks')
    localStorage.removeItem('studyhub_sessions')
    renderTasks()
    renderSessions()
    updateStats()
    renderCalendar()
    alert('All data has been cleared.')
  }
}



// Modal management
function closeModal (modalId) {
  document.getElementById(modalId).classList.remove('active')
}



// Close modals when clicking outside
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active')
  }
})



// Data persistence
function saveTasks () {
  localStorage.setItem('studyhub_tasks', JSON.stringify(tasks))
}

function saveSessions () {
  localStorage.setItem('studyhub_sessions', JSON.stringify(sessions))
}

function saveSettings () {
  localStorage.setItem('studyhub_settings', JSON.stringify(settings))
}



// Initialize focus duration setting
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('focusDuration').value = settings.focusDuration
})
