import React, { useState, useEffect, useRef } from 'react';
import { Plus, Archive, Trash2, Check, TrendingUp, Calendar, BarChart3, Award, Target, Menu, X, Home, Sun, Moon, Download, Upload } from 'lucide-react';

const HabitTracker = () => {
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Study', description: '', priority: 'Medium' });
  const [editingHabit, setEditingHabit] = useState(null);
  const [archivedHabit, setArchivedHabit] = useState(null);
  const undoTimeoutRef = useRef(null);
  const importInputRef = useRef(null);
  const [dataFeedback, setDataFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState('habits');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('mukil-habits-theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = savedTheme;
    return savedTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mukil-habits-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadHabits();

    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadHabits();
      }
    }, 60000);

    return () => {
      clearInterval(checkMidnight);
      clearTimeout(undoTimeoutRef.current);
    };
  }, []);

 const loadHabits = () => {
  try {
    const stored = localStorage.getItem('mukil-habits');
    if (stored) {
      setHabits(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Error loading habits:', error);
  } finally {
    setIsLoading(false);
  }
};

 const saveHabits = (updatedHabits) => {
  try {
    localStorage.setItem('mukil-habits', JSON.stringify(updatedHabits));
  } catch (error) {
    console.error('Error saving habits:', error);
  }
};
  const exportHabits = () => {
    const backup = new Blob([JSON.stringify(habits, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(backup);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `mukil-habits-backup-${getLocalDateString()}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    setDataFeedback(`Exported ${habits.length} habit${habits.length === 1 ? '' : 's'}.`);
  };

  const importHabits = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const importedHabits = JSON.parse(await file.text());
      const isValid = Array.isArray(importedHabits) && importedHabits.every(habit =>
        habit && typeof habit.id === 'string' && typeof habit.name === 'string' &&
        Array.isArray(habit.completions) && typeof habit.createdAt === 'string' &&
        (habit.notDoneDates === undefined || Array.isArray(habit.notDoneDates))
      );

      if (!isValid) throw new Error('Invalid backup');
      if (!window.confirm(`Replace all current habits with ${importedHabits.length} imported habit${importedHabits.length === 1 ? '' : 's'}? This cannot be undone.`)) return;

      setHabits(importedHabits);
      saveHabits(importedHabits);
      setDataFeedback(`Imported ${importedHabits.length} habit${importedHabits.length === 1 ? '' : 's'}.`);
    } catch {
      setDataFeedback('Import failed. Choose a valid Habit Tracker backup file.');
    }
  };
  const navigateToPage = (page) => {
    setActivePage(page);
    setIsNavigationOpen(false);
    setShowAddForm(false);
    setEditingHabit(null);
  };

  const shiftSelectedDate = (days) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  };

  const shiftSelectedMonth = (months) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    setSelectedDate(getLocalDateString(date));
  };
  const addHabit = () => {
    if (!newHabit.name.trim()) return;

    const habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      category: newHabit.category,
      description: newHabit.description,
      priority: newHabit.priority,
      completions: [],
      notDoneDates: [],
      createdAt: new Date().toISOString()
    };

    const updatedHabits = [...habits, habit];
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    setNewHabit({ name: '', category: 'Study', description: '', priority: 'Medium' });
    setShowAddForm(false);
  };

  const markHabitDone = (habitId) => {
    const dateToUse = selectedDate;
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = habit.completions || [];
        return {
          ...habit,
          completions: completions.includes(dateToUse)
            ? completions.filter(date => date !== dateToUse)
            : [...completions, dateToUse],
          notDoneDates: completions.includes(dateToUse)
            ? habit.notDoneDates || []
            : (habit.notDoneDates || []).filter(date => date !== dateToUse)
        };
      }
      return habit;
    });

    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const markHabitNotDone = (habitId) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const notDoneDates = habit.notDoneDates || [];
        return {
          ...habit,
          completions: notDoneDates.includes(selectedDate)
            ? habit.completions || []
            : (habit.completions || []).filter(date => date !== selectedDate),
          notDoneDates: notDoneDates.includes(selectedDate)
            ? notDoneDates.filter(date => date !== selectedDate)
            : [...notDoneDates, selectedDate]
        };
      }
      return habit;
    });
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const archiveHabit = (habitId) => {
    const updatedHabits = habits.map(habit =>
      habit.id === habitId ? { ...habit, archived: true } : habit
    );
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    clearTimeout(undoTimeoutRef.current);
    setArchivedHabit(habitId);
    setEditingHabit(null);
    undoTimeoutRef.current = setTimeout(() => setArchivedHabit(null), 5000);
  };

  const restoreHabit = (habitId) => {
    const updatedHabits = habits.map(habit =>
      habit.id === habitId ? { ...habit, archived: false } : habit
    );
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    clearTimeout(undoTimeoutRef.current);
    setArchivedHabit(null);
  };

  const permanentlyDeleteHabit = (habitId) => {
    const updatedHabits = habits.filter(habit => habit.id !== habitId);
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    if (archivedHabit === habitId) {
      clearTimeout(undoTimeoutRef.current);
      setArchivedHabit(null);
    }
  };

  const startEditingHabit = (habit) => {
    setEditingHabit({ ...habit });
  };

  const updateHabit = () => {
    if (!editingHabit.name.trim()) return;

    const updatedHabits = habits.map(habit =>
      habit.id === editingHabit.id
        ? { ...habit, name: editingHabit.name, category: editingHabit.category, description: editingHabit.description, priority: editingHabit.priority }
        : habit
    );
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    setEditingHabit(null);
  };

  const isCompletedOnDate = (completions, date) => {
    return completions && completions.includes(date);
  };

  const isEvaluatedOnDate = (completions, notDoneDates, date) => {
    return isCompletedOnDate(completions, date) || isCompletedOnDate(notDoneDates, date);
  };

  const activeHabits = habits.filter(habit => !habit.archived);
  const archivedHabits = habits.filter(habit => habit.archived);
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
  const selectedWeekStart = new Date(selectedDateObject);
  selectedWeekStart.setDate(selectedDateObject.getDate() - selectedDateObject.getDay());
  const selectedWeekEnd = new Date(selectedWeekStart);
  selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6);

  const getHabitStreak = (habit) => {
    const createdDate = getLocalDateString(new Date(habit.createdAt));
    const date = new Date(`${selectedDate}T00:00:00`);
    let streak = 0;

    while (getLocalDateString(date) >= createdDate) {
      const dateStr = getLocalDateString(date);
      if (isCompletedOnDate(habit.completions, dateStr)) {
        streak++;
      } else if (isCompletedOnDate(habit.notDoneDates, dateStr)) {
        break;
      }
      date.setDate(date.getDate() - 1);
    }

    return streak;
  };

  const getWeeklyProgress = (completions, notDoneDates) => {
    const weekStart = new Date(selectedWeekStart);

    let completed = 0;
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = getLocalDateString(date);
      if (!isEvaluatedOnDate(completions, notDoneDates, dateStr)) continue;
      total++;
      if (isCompletedOnDate(completions, dateStr)) completed++;
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const getMonthlyProgress = (completions, notDoneDates) => {
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let completed = 0;
    let total = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getLocalDateString(date);
      if (!isEvaluatedOnDate(completions, notDoneDates, dateStr)) continue;
      total++;
      if (isCompletedOnDate(completions, dateStr)) completed++;
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const getCategoryColor = (category) => {
    const colors = {
      Study: 'bg-[var(--primary)]',
      Coding: 'bg-[var(--primary)]',
      Health: 'bg-[var(--success)]',
      Personal: 'bg-[var(--warning)]'
    };
    return colors[category] || 'bg-[var(--text-muted)]';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-[var(--danger)]',
      Medium: 'bg-[var(--warning)]',
      Low: 'bg-[var(--text-muted)]'
    };
    return colors[priority] || 'bg-[var(--text-muted)]';
  };

  const getPriorityOrder = (priority) => {
    const order = { High: 1, Medium: 2, Low: 3 };
    return order[priority] || 4;
  };

  const calculateDailyScore = (date) => {
    let earnedPoints = 0;
    let maxPoints = 0;

    activeHabits.forEach(habit => {
      const priority = habit.priority || 'Medium';
      const points = priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1;
      if (!isEvaluatedOnDate(habit.completions, habit.notDoneDates, date)) return;
      maxPoints += points;
      if (isCompletedOnDate(habit.completions, date)) earnedPoints += points;
    });

    const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    return { earnedPoints, maxPoints, percentage };
  };

  const generateCalendarHeatmap = (year, month) => {
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const weeks = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;

    for (let j = firstDayOfWeek; j < 7 && dayCounter <= daysInMonth; j++) {
      const date = new Date(year, month, dayCounter);
      const dateStr = getLocalDateString(date);
      const completedCount = activeHabits.filter(h =>
        h.completions && h.completions.includes(dateStr)
      ).length;
      const evaluatedCount = activeHabits.filter(h =>
        isEvaluatedOnDate(h.completions, h.notDoneDates, dateStr)
      ).length;

      const dayScore = calculateDailyScore(dateStr);

      week[j] = {
        day: dayCounter,
        date: dateStr,
        count: completedCount,
        total: evaluatedCount,
        percentage: dayScore.percentage
      };
      dayCounter++;
    }
    weeks.push([...week]);

    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let j = 0; j < 7 && dayCounter <= daysInMonth; j++) {
        const date = new Date(year, month, dayCounter);
        const dateStr = getLocalDateString(date);
        const completedCount = activeHabits.filter(h =>
          h.completions && h.completions.includes(dateStr)
        ).length;
        const evaluatedCount = activeHabits.filter(h =>
          isEvaluatedOnDate(h.completions, h.notDoneDates, dateStr)
        ).length;

        const dayScore = calculateDailyScore(dateStr);

        week[j] = {
          day: dayCounter,
          date: dateStr,
          count: completedCount,
          total: evaluatedCount,
          percentage: dayScore.percentage
        };
        dayCounter++;
      }
      weeks.push([...week]);
    }

    return {
      name: monthName,
      year: year,
      weeks: weeks
    };
  };

  const getHeatmapColor = (percentage, total) => {
    if (total === 0) return 'bg-[var(--surface-2)]';
    if (percentage === 0) return 'bg-[var(--danger)]';
    if (percentage >= 80) return 'bg-[var(--success)]';
    if (percentage >= 60) return 'bg-[var(--success)]';
    if (percentage >= 40) return 'bg-[var(--warning)]';
    return 'bg-[var(--danger)]';
  };

  const generateMonthData = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let completed = 0;
    let total = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getLocalDateString(date);
      const dayCompleted = activeHabits.filter(h =>
        h.completions && h.completions.includes(dateStr)
      ).length;
      const dayEvaluated = activeHabits.some(h =>
        isEvaluatedOnDate(h.completions, h.notDoneDates, dateStr)
      );
      if (dayEvaluated) total++;
      if (dayCompleted > 0) completed++;
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalCompletionsOnSelectedDate = activeHabits.filter(h => isCompletedOnDate(h.completions, selectedDate)).length;
  const totalEvaluatedOnSelectedDate = activeHabits.filter(h => isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length;
  const totalHabits = activeHabits.length;
  const selectedDateCompletionRate = totalEvaluatedOnSelectedDate > 0 ? Math.round((totalCompletionsOnSelectedDate / totalEvaluatedOnSelectedDate) * 100) : 0;

  const weeklyStats = activeHabits.reduce((acc, habit) => {
    const progress = getWeeklyProgress(habit.completions, habit.notDoneDates);
    return {
      completed: acc.completed + progress.completed,
      total: acc.total + progress.total
    };
  }, { completed: 0, total: 0 });
  const weeklyRate = weeklyStats.total > 0 ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) : 0;

  const monthlyStats = activeHabits.reduce((acc, habit) => {
    const progress = getMonthlyProgress(habit.completions, habit.notDoneDates);
    return {
      completed: acc.completed + progress.completed,
      total: acc.total + progress.total
    };
  }, { completed: 0, total: 0 });
  const monthlyRate = monthlyStats.total > 0 ? Math.round((monthlyStats.completed / monthlyStats.total) * 100) : 0;

  const sortedHabits = [...activeHabits].sort((a, b) => {
    return getPriorityOrder(a.priority || 'Medium') - getPriorityOrder(b.priority || 'Medium');
  });

  const totalCompletions = activeHabits.reduce((sum, h) => sum + (h.completions?.length || 0), 0);
  const averageCompletion = activeHabits.length > 0 ? Math.round(totalCompletions / activeHabits.length) : 0;
  const habitsOnStreak = activeHabits.filter(habit => getHabitStreak(habit) > 0).length;

  const selectedMonthData = generateMonthData(selectedDateObject.getFullYear(), selectedDateObject.getMonth());
  const calendarMonths = [-1, 0, 1].map(offset => {
    const date = new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth() + offset, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      isSelected: offset === 0
    };
  });
  const selectedDateScore = calculateDailyScore(selectedDate);

  const calculateAverageScore = () => {
    if (activeHabits.length === 0) return 0;

    const allEvaluationDates = new Set();
    activeHabits.forEach(habit => {
      if (habit.completions) {
        habit.completions.forEach(date => allEvaluationDates.add(date));
      }
      if (habit.notDoneDates) habit.notDoneDates.forEach(date => allEvaluationDates.add(date));
    });

    if (allEvaluationDates.size === 0) return 0;

    let totalPercentage = 0;
    allEvaluationDates.forEach(date => {
      const score = calculateDailyScore(date);
      totalPercentage += score.percentage;
    });

    return Math.round(totalPercentage / allEvaluationDates.size);
  };

  const averageScore = calculateAverageScore();

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return { bg: 'bg-[var(--success)]', text: 'text-[var(--success)]', label: 'Excellent!' };
    if (percentage >= 60) return { bg: 'bg-[var(--warning)]', text: 'text-[var(--warning)]', label: 'Good!' };
    if (percentage >= 40) return { bg: 'bg-[var(--warning)]', text: 'text-[var(--warning)]', label: 'Fair' };
    return { bg: 'bg-[var(--danger)]', text: 'text-[var(--danger)]', label: 'Needs Work' };
  };

  const scoreColor = getScoreColor(selectedDateScore.percentage);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-[var(--text-muted)]">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isNavigationOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[var(--text)]/35 backdrop-blur-[1px]"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 ${
        isNavigationOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-6">
          <div>
            <div className="font-serif text-xl font-bold tracking-tight text-[var(--text)]">Mukil Habits</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">A quieter way to stay consistent</div>
          </div>
          <button
            aria-label="Close navigation"
            onClick={() => setIsNavigationOpen(false)}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Workspace</div>
          {[
            { id: 'habits', label: 'Habits', icon: Home },
            { id: 'weekly', label: 'Weekly', icon: Calendar },
            { id: 'monthly', label: 'Monthly', icon: Calendar },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigateToPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold ${
                  activePage === item.id
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'border-[var(--transparent)] text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Appearance</div>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
            <button
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                theme === 'light' ? 'bg-[var(--surface)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Sun size={16} />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                theme === 'dark' ? 'bg-[var(--surface)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Data</div>
          <button onClick={exportHabits} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
            <Download size={16} /> Export backup
          </button>
          <button onClick={() => importInputRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
            <Upload size={16} /> Import backup
          </button>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importHabits} />
          {dataFeedback && <p className="px-3 pt-2 text-xs text-[var(--text-muted)]" role="status">{dataFeedback}</p>}
        </div>
      </aside>

      <div className="mx-auto max-w-5xl p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:mb-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 sm:pb-6">
            <button
              aria-label="Open navigation"
              onClick={() => setIsNavigationOpen(true)}
              className="shrink-0 rounded-lg border border-[var(--border)] p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="mb-1 text-2xl font-bold text-[var(--text)] sm:mb-2 sm:text-4xl">
                Welcome, <span className="text-[var(--primary)]">Mukil</span>!
              </h1>
              <p className="text-sm text-[var(--text-muted)] sm:text-base">Building better habits, one day at a time</p>
            </div>
          </div>

          {/* Date Selector */}
          {activePage === 'habits' && (
          <div className="mb-4 sm:mb-6">
            <label className="mb-2 block text-xs font-semibold text-[var(--text)] sm:text-sm">
              Select Date to Track:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none sm:px-4"
              />
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface-2)] sm:px-4"
              >
                Today
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-sm">
              Tracking: <span className="font-semibold text-[var(--primary)]">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </p>
          </div>
          )}

          {activePage === 'weekly' && (
            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Selected Week</div>
                <div className="text-base font-bold text-[var(--text)] sm:text-lg">
                  {selectedWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                <button onClick={() => shiftSelectedDate(-7)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">Previous</button>
                <button onClick={() => setSelectedDate(getLocalDateString())} className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-hover)]">Today</button>
                <button onClick={() => shiftSelectedDate(7)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">Next</button>
              </div>
            </div>
          )}

          {(activePage === 'monthly' || activePage === 'stats') && (
            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Selected Month</div>
                <div className="text-base font-bold text-[var(--text)] sm:text-lg">
                  {selectedDateObject.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                <button onClick={() => shiftSelectedMonth(-1)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">Previous</button>
                <button onClick={() => setSelectedDate(getLocalDateString())} className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-hover)]">Today</button>
                <button onClick={() => shiftSelectedMonth(1)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]">Next</button>
              </div>
            </div>
          )}

          {/* Daily Score Display */}
          {activePage === 'habits' && activeHabits.length > 0 && selectedDateScore.maxPoints > 0 && (
            <div className="mb-4 border border-[var(--border)] bg-[var(--bg)] p-4 sm:mb-6 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-[var(--text-muted)] sm:text-sm">Daily Score</h3>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className={`text-2xl sm:text-4xl font-bold ${scoreColor.text}`}>
                      {selectedDateScore.earnedPoints}
                    </span>
                    <span className="text-lg text-[var(--text-muted)] sm:text-2xl">/</span>
                    <span className="text-lg font-semibold text-[var(--text)] sm:text-2xl">
                      {selectedDateScore.maxPoints}
                    </span>
                    <span className="ml-1 text-xs text-[var(--text-muted)] sm:text-sm">pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl sm:text-2xl font-bold ${scoreColor.text} mb-1`}>
                    {selectedDateScore.percentage}%
                  </div>
                  <div className={`text-xs sm:text-sm font-semibold ${scoreColor.text}`}>
                    {scoreColor.label}
                  </div>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="relative mb-3 h-2 w-full rounded-full bg-[var(--surface-2)] sm:h-3">
                <div
                  className={`${scoreColor.bg} h-2 sm:h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${selectedDateScore.percentage}%` }}
                />
              </div>

              {/* Comparison with Average */}
              {averageScore > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                  <span className="text-[var(--text-muted)]">Average:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text)]">{averageScore}%</span>
                    {selectedDateScore.percentage > averageScore ? (
                      <span className="text-[var(--success)] text-xs">Above</span>
                    ) : selectedDateScore.percentage < averageScore ? (
                      <span className="text-[var(--warning)] text-xs">Below</span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">= Equal</span>
                    )}
                  </div>
                </div>
              )}

              {/* Points Breakdown */}
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-xs">
                <div className="text-center">
                  <div className="mb-1 text-[var(--text-muted)]">High (3)</div>
                  <div className="font-semibold text-[var(--danger)]">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'High' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'High' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-[var(--text-muted)]">Med (2)</div>
                  <div className="font-semibold text-[var(--warning)]">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Medium' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Medium' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-[var(--text-muted)]">Low (1)</div>
                  <div className="font-semibold text-[var(--text-muted)]">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Low' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Low' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'habits' && activeHabits.length > 0 && selectedDateScore.maxPoints === 0 && (
            <div className="mb-4 border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-center sm:mb-6 sm:p-6">
              <h3 className="mb-1 text-base font-bold text-[var(--text)] sm:text-lg">No habits evaluated</h3>
              <p className="text-sm text-[var(--text-muted)]">Unmarked habits are excused for this date.</p>
            </div>
          )}

          {/* Stats Cards */}
          {activePage === 'habits' && selectedDateScore.maxPoints > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[var(--border)] bg-[var(--primary-subtle)] p-3 text-[var(--primary)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Habits</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalHabits}</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--success-subtle)] p-3 text-[var(--success)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Check size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Done</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsOnSelectedDate}/{totalEvaluatedOnSelectedDate}</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--warning-subtle)] p-3 text-[var(--warning)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Rate</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{selectedDateCompletionRate}%</div>
              </div>
            </div>
          )}

          {activePage === 'weekly' && activeHabits.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[var(--border)] bg-[var(--primary-subtle)] p-3 text-[var(--primary)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <BarChart3 size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Week</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold">{weeklyStats.completed}/{weeklyStats.total}</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--success-subtle)] p-3 text-[var(--success)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Rate</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{weeklyRate}%</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--warning-subtle)] p-3 text-[var(--warning)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Check size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Selected Date</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsOnSelectedDate}/{totalEvaluatedOnSelectedDate}</div>
              </div>
            </div>
          )}

          {activePage === 'monthly' && activeHabits.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[var(--border)] bg-[var(--primary-subtle)] p-3 text-[var(--primary)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <BarChart3 size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Month</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold">{monthlyStats.completed}/{monthlyStats.total}</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--success-subtle)] p-3 text-[var(--success)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Rate</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{monthlyRate}%</div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--warning-subtle)] p-3 text-[var(--warning)] sm:p-4">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Check size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Selected Date</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsOnSelectedDate}/{totalEvaluatedOnSelectedDate}</div>
              </div>
            </div>
          )}
        </div>

        {(activePage === 'weekly' || activePage === 'monthly') && activeHabits.length > 0 && (
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {sortedHabits.map(habit => {
              const progress = activePage === 'weekly'
                ? getWeeklyProgress(habit.completions, habit.notDoneDates)
                : getMonthlyProgress(habit.completions, habit.notDoneDates);
              const period = activePage === 'weekly' ? 'Weekly' : 'Monthly';

              return (
                <div key={habit.id} className="border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`${getCategoryColor(habit.category)} rounded-full px-3 py-1 text-xs font-semibold text-[var(--on-primary)]`}>
                      {habit.category}
                    </span>
                    <span className={`${getPriorityColor(habit.priority || 'Medium')} rounded-full px-3 py-1 text-xs font-semibold text-[var(--on-primary)]`}>
                      {habit.priority || 'Medium'}
                    </span>
                  </div>
                  <h3 className="mb-1 text-base font-bold text-[var(--text)] sm:text-xl">{habit.name}</h3>
                  {habit.description && <p className="mb-4 text-xs text-[var(--text-muted)] sm:text-sm">{habit.description}</p>}
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">{period} progress</span>
                    <span className="font-semibold text-[var(--primary)]">
                      {progress.completed}/{progress.total} evaluated days
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-2 rounded-full bg-[var(--success)] transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {progress.total > 0 ? `${progress.percentage}% complete` : 'No evaluated days yet'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistics Page */}
        {activePage === 'stats' && activeHabits.length > 0 && (
          <div className="mb-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:mb-6 sm:p-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--text)] sm:mb-6 sm:text-2xl">
              <Award className="text-[var(--primary)]" size={20} />
              Statistics Dashboard
            </h2>

            {/* Key Metrics */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-4">
              <div className="border border-[var(--border)] bg-[var(--success-subtle)] p-3 sm:p-4">
                <div className="mb-1 text-xs text-[var(--text-muted)] sm:text-sm">Total Completions</div>
                <div className="flex items-center gap-1 text-xl font-bold text-[var(--success)] sm:gap-2 sm:text-3xl">
                  <Target size={18} className="sm:w-6 sm:h-6" />
                  {totalCompletions}
                </div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--primary-subtle)] p-3 sm:p-4">
                <div className="mb-1 text-xs text-[var(--text-muted)] sm:text-sm">Avg per Habit</div>
                <div className="text-xl font-bold text-[var(--primary)] sm:text-3xl">
                  {averageCompletion}
                </div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--warning-subtle)] p-3 sm:p-4">
                <div className="mb-1 text-xs text-[var(--text-muted)] sm:text-sm">Habits on a Streak</div>
                <div className="text-xl font-bold text-[var(--warning)] sm:text-3xl">
                  {habitsOnStreak}
                </div>
              </div>
            </div>

            {/* Month/Year Selector */}
            <div className="mb-4 sm:mb-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text)] sm:text-lg">Monthly Overview</h3>

              <div className="border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text)] sm:text-base">
                    {monthNames[selectedDateObject.getMonth()]} {selectedDateObject.getFullYear()}
                  </span>
                  <span className="text-sm font-bold text-[var(--primary)] sm:text-base">
                    {selectedMonthData.completed}/{selectedMonthData.total} days
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--surface-2)] sm:h-3">
                  <div
                    className="h-2 rounded-full bg-[var(--success)] transition-all sm:h-3"
                    style={{ width: `${selectedMonthData.percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-sm">{selectedMonthData.percentage}% completion</p>
              </div>
            </div>

            {/* Activity Heatmap - Previous, Selected, and Next Month */}
            <div className="mx-auto mb-4 max-w-2xl sm:mb-6">
              <h3 className="mb-3 text-base font-semibold text-[var(--text)] sm:text-lg">Activity Calendar</h3>
              <div className="space-y-3">
                {calendarMonths.map(({ year, month, isSelected }) => {
                  const calendar = generateCalendarHeatmap(year, month);
                  const sizeClasses = isSelected
                    ? 'gap-1 text-xs sm:text-sm'
                    : 'gap-0.5 text-[10px] sm:text-xs';

                  return (
                    <div key={`${year}-${month}`} className={`border ${
                      isSelected ? 'mx-auto max-w-md border-[var(--border)] bg-[var(--bg)] p-2 sm:p-3' : 'mx-auto max-w-xs border-[var(--border)] bg-[var(--surface-2)] p-1.5 opacity-85'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${isSelected ? 'text-[var(--text)] text-sm sm:text-base' : 'text-[var(--text-muted)] text-xs sm:text-sm'}`}>
                          {calendar.name} {calendar.year}
                        </span>
                        {isSelected && <span className="text-xs font-semibold text-[var(--primary)]">Selected month</span>}
                      </div>
                      <div className={`mb-1 grid grid-cols-7 ${sizeClasses} text-[var(--text-muted)]`}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                          <div key={`${label}-${index}`} className="text-center">{label}</div>
                        ))}
                      </div>
                      {calendar.weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className={`grid grid-cols-7 ${sizeClasses} mb-0.5`}>
                          {week.map((day, dayIdx) => (
                            <button
                              key={dayIdx}
                              className={`${isSelected ? 'aspect-square' : 'h-4 sm:h-5'} rounded flex items-center justify-center ${
                                day ? `${getHeatmapColor(day.percentage, day.total)} hover:ring-1 hover:ring-[var(--primary)]` : 'bg-[var(--transparent)]'
                              }`}
                              onClick={() => day && (setSelectedDate(day.date), navigateToPage('habits'))}
                              disabled={!day}
                              aria-label={day ? `Open habits for ${day.date}: ${day.count} of ${day.total} completed` : undefined}
                              title={day ? `${day.date}: ${day.count}/${day.total} habits (${day.percentage}%)` : ''}
                            >
                              {day && <span className="text-[var(--on-primary)] font-medium">{day.day}</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] sm:gap-4">
                <span>Poor</span>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-3 rounded bg-[var(--danger)]" />
                  <div className="h-3 w-3 rounded bg-[var(--warning)]" />
                  <div className="h-3 w-3 rounded bg-[var(--warning)]" />
                  <div className="h-3 w-3 rounded bg-[var(--success)]" />
                </div>
                <span>Excellent</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text)]">Habits by Category</h3>
              <div className="space-y-2">
                {['Study', 'Coding', 'Health', 'Personal'].map(category => {
                  const categoryHabits = activeHabits.filter(h => h.category === category);
                  const count = categoryHabits.length;
                  if (count === 0) return null;

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className={`${getCategoryColor(category)} text-[var(--on-primary)] text-xs px-3 py-1 rounded-full font-semibold w-24 text-center`}>
                        {category}
                      </span>
                      <div className="h-6 flex-1 rounded-full bg-[var(--surface-2)]">
                        <div
                          className={`${getCategoryColor(category)} h-6 rounded-full flex items-center justify-center text-[var(--on-primary)] text-xs font-semibold`}
                          style={{ width: `${(count / activeHabits.length) * 100}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activePage !== 'habits' && activeHabits.length === 0 && (
          <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12">
            <h2 className="mb-2 text-xl font-bold text-[var(--text)]">No active habits to summarize</h2>
            <p className="text-sm text-[var(--text-muted)]">Add or restore a habit to see this page's insights.</p>
          </div>
        )}

        {activePage === 'habits' && (
        <>
        {/* Add Habit Button */}
        {!showAddForm && !editingHabit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-4 flex w-full items-center justify-center gap-2 border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--surface-2)] sm:mb-6 sm:p-6 sm:text-base"
          >
            <Plus size={20} />
            Add New Habit
          </button>
        )}

        {/* Add Habit Form */}
        {(showAddForm || editingHabit) && (
          <div className="mb-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:mb-6 sm:p-6">
            <h3 className="mb-1 text-lg font-bold text-[var(--text)] sm:text-xl">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h3>
            <p className="mb-5 text-sm text-[var(--text-muted)]">Keep the details simple and easy to revisit.</p>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">Habit name</label>
            <input
              type="text"
              placeholder="Habit name (e.g., Study DSA for 1 hour)"
              value={editingHabit ? editingHabit.name : newHabit.name}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, name: e.target.value }) : setNewHabit({ ...newHabit, name: e.target.value })}
              className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">Category</label>
                <select
                  value={editingHabit ? editingHabit.category : newHabit.category}
                  onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, category: e.target.value }) : setNewHabit({ ...newHabit, category: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="Study">Study</option>
                  <option value="Coding">Coding</option>
                  <option value="Health">Health</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">Priority</label>
                <select
                  value={editingHabit ? editingHabit.priority : newHabit.priority}
                  onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, priority: e.target.value }) : setNewHabit({ ...newHabit, priority: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text)]">Description <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
            <input
              type="text"
              placeholder="Description (optional)"
              value={editingHabit ? editingHabit.description : newHabit.description}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, description: e.target.value }) : setNewHabit({ ...newHabit, description: e.target.value })}
              className="mb-5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={editingHabit ? updateHabit : addHabit}
                className="flex-1 rounded-lg bg-[var(--primary)] py-3 text-sm font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
              >
                {editingHabit ? 'Save Changes' : 'Create Habit'}
              </button>
              <button
                onClick={() => editingHabit ? setEditingHabit(null) : setShowAddForm(false)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {archivedHabit && (
          <div className="mb-4 flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--text)] p-3 text-sm text-[var(--on-primary)] sm:mb-6 sm:p-4">
            <span>Habit archived</span>
            <button
              onClick={() => restoreHabit(archivedHabit)}
              className="font-semibold text-[var(--primary)] hover:text-[var(--on-primary)]"
            >
              Undo
            </button>
          </div>
        )}

        {/* Habits List */}
        {activeHabits.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12">
            <div className="text-5xl sm:text-6xl mb-4">Target</div>
            <h3 className="mb-2 text-xl font-bold text-[var(--text)] sm:text-2xl">No active habits!</h3>
            <p className="text-sm text-[var(--text-muted)] sm:text-base">Click "Add New Habit" to start building better habits.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sortedHabits.map(habit => {
              const completed = isCompletedOnDate(habit.completions, selectedDate);
              const notDone = isCompletedOnDate(habit.notDoneDates, selectedDate);
              const streak = getHabitStreak(habit);
              const isToday = selectedDate === getLocalDateString();

              return (
                <div
                  key={habit.id}
                  className={`border bg-[var(--surface)] p-4 transition-all sm:p-6 ${
                    completed ? 'border-[var(--success)] bg-[var(--success-subtle)]' : notDone ? 'border-[var(--danger)] bg-[var(--danger-subtle)]' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between sm:mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <span className={`${getCategoryColor(habit.category)} rounded-full px-2 py-1 text-xs font-semibold text-[var(--on-primary)] sm:px-3`}>
                          {habit.category}
                        </span>
                        <span className={`${getPriorityColor(habit.priority || 'Medium')} rounded-full px-2 py-1 text-xs font-semibold text-[var(--on-primary)] sm:px-3`}>
                          {habit.priority || 'Medium'}
                        </span>
                      </div>
                      <h3 className="mb-1 text-base font-bold text-[var(--text)] sm:text-xl">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-xs text-[var(--text-muted)] sm:text-sm">{habit.description}</p>
                      )}

                      <p className="mt-2 text-xs text-[var(--text-muted)] sm:mt-3 sm:text-sm">
                        Current streak: {streak} completed {streak === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingHabit(habit)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface-2)]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => archiveHabit(habit.id)}
                        className="rounded-lg p-2 text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                      >
                        <Archive size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button
                    onClick={() => markHabitDone(habit.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold sm:py-4 sm:text-base ${
                      completed
                        ? 'bg-[var(--success)] text-[var(--on-primary)] hover:bg-[var(--success-hover)]'
                        : 'border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <Check size={18} className="sm:w-5 sm:h-5" />
                    {completed
                      ? `Done ${isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}!`
                      : `Mark ${isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    }
                  </button>
                    <button
                      onClick={() => markHabitNotDone(habit.id)}
                      className={`flex-1 rounded-lg py-3 text-sm font-semibold sm:py-4 sm:text-base ${
                        notDone
                          ? 'bg-[var(--danger)] text-[var(--on-primary)] hover:bg-[var(--danger-hover)]'
                          : 'border border-[var(--danger)] bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger-subtle)]'
                      }`}
                    >
                      Not Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {archivedHabits.length > 0 && (
          <div className="mt-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:mt-6 sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-[var(--text)] sm:text-xl">Archived Habits</h2>
            <div className="space-y-2">
              {archivedHabits.map(habit => (
                <div key={habit.id} className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div>
                    <div className="font-semibold text-[var(--text)]">{habit.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">Archived habit</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => restoreHabit(habit.id)}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface)]"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => permanentlyDeleteHabit(habit.id)}
                      className="rounded-lg p-2 text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                      aria-label={`Permanently delete ${habit.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
