import React, { useState, useEffect, useRef } from 'react';
import { Plus, Archive, Trash2, Check, TrendingUp, Calendar, BarChart3, Award, Target, Menu, X, Home } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState('habits');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

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
      Study: 'bg-blue-500',
      Coding: 'bg-purple-500',
      Health: 'bg-green-500',
      Personal: 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-500',
      Medium: 'bg-yellow-500',
      Low: 'bg-gray-500'
    };
    return colors[priority] || 'bg-gray-500';
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
    if (total === 0) return 'bg-gray-100';
    if (percentage === 0) return 'bg-red-500';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
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
    if (percentage >= 80) return { bg: 'bg-green-500', text: 'text-green-600', label: 'Excellent!' };
    if (percentage >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Good!' };
    if (percentage >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', label: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-600', label: 'Needs Work' };
  };

  const scoreColor = getScoreColor(selectedDateScore.percentage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      {isNavigationOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ${
        isNavigationOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <div className="text-lg font-bold text-slate-800">Mukil Habits</div>
            <div className="text-xs text-slate-500">Stay consistent, your way</div>
          </div>
          <button
            aria-label="Close navigation"
            onClick={() => setIsNavigationOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
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
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activePage === item.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="mx-auto max-w-5xl p-3 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 sm:pb-6">
            <button
              aria-label="Open navigation"
              onClick={() => setIsNavigationOpen(true)}
              className="shrink-0 rounded-xl p-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                Welcome, <span className="text-indigo-600">Mukil</span>! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Building better habits, one day at a time</p>
            </div>
          </div>

          {/* Date Selector */}
          {activePage === 'habits' && (
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Select Date to Track:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className="px-3 sm:px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
              >
                Today
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Tracking: <span className="font-semibold text-indigo-600">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </p>
          </div>
          )}

          {activePage === 'weekly' && (
            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Week</div>
                <div className="text-base sm:text-lg font-bold text-slate-800">
                  {selectedWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {selectedWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                <button onClick={() => shiftSelectedDate(-7)} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Previous</button>
                <button onClick={() => setSelectedDate(getLocalDateString())} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Today</button>
                <button onClick={() => shiftSelectedDate(7)} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Next</button>
              </div>
            </div>
          )}

          {(activePage === 'monthly' || activePage === 'stats') && (
            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Month</div>
                <div className="text-base sm:text-lg font-bold text-slate-800">
                  {selectedDateObject.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                <button onClick={() => shiftSelectedMonth(-1)} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Previous</button>
                <button onClick={() => setSelectedDate(getLocalDateString())} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Today</button>
                <button onClick={() => shiftSelectedMonth(1)} className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Next</button>
              </div>
            </div>
          )}

          {/* Daily Score Display */}
          {activePage === 'habits' && activeHabits.length > 0 && selectedDateScore.maxPoints > 0 && (
            <div className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl border-2 ${scoreColor.bg} bg-opacity-10 border-opacity-30`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Daily Score</h3>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className={`text-2xl sm:text-4xl font-bold ${scoreColor.text}`}>
                      {selectedDateScore.earnedPoints}
                    </span>
                    <span className="text-lg sm:text-2xl text-gray-400">/</span>
                    <span className="text-lg sm:text-2xl font-semibold text-gray-600">
                      {selectedDateScore.maxPoints}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">pts</span>
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
              <div className="relative w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3">
                <div 
                  className={`${scoreColor.bg} h-2 sm:h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${selectedDateScore.percentage}%` }}
                />
              </div>

              {/* Comparison with Average */}
              {averageScore > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                  <span className="text-gray-600">Average:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">{averageScore}%</span>
                    {selectedDateScore.percentage > averageScore ? (
                      <span className="text-green-600 text-xs">↑ Above!</span>
                    ) : selectedDateScore.percentage < averageScore ? (
                      <span className="text-orange-600 text-xs">↓ Below</span>
                    ) : (
                      <span className="text-gray-600 text-xs">= Equal</span>
                    )}
                  </div>
                </div>
              )}

              {/* Points Breakdown */}
              <div className="pt-3 border-t border-gray-300 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-500 mb-1">High (3)</div>
                  <div className="font-semibold text-red-600">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'High' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'High' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Med (2)</div>
                  <div className="font-semibold text-yellow-600">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Medium' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Medium' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Low (1)</div>
                  <div className="font-semibold text-gray-600">
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Low' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {activeHabits.filter(h => (h.priority || 'Medium') === 'Low' && isEvaluatedOnDate(h.completions, h.notDoneDates, selectedDate)).length}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activePage === 'habits' && activeHabits.length > 0 && selectedDateScore.maxPoints === 0 && (
            <div className="mb-4 sm:mb-6 bg-indigo-50 border-2 border-indigo-100 rounded-xl p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-bold text-indigo-700 mb-1">No habits evaluated</h3>
              <p className="text-sm text-indigo-600">Unmarked habits are excused for this date.</p>
            </div>
          )}

          {/* Stats Cards */}
          {activePage === 'habits' && selectedDateScore.maxPoints > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Habits</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalHabits}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Check size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Done</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsOnSelectedDate}/{totalEvaluatedOnSelectedDate}</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-3 sm:p-4 text-white">
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
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <BarChart3 size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Week</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold">{weeklyStats.completed}/{weeklyStats.total}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Rate</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{weeklyRate}%</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-3 sm:p-4 text-white">
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
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <BarChart3 size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Month</span>
                </div>
                <div className="text-xl sm:text-3xl font-bold">{monthlyStats.completed}/{monthlyStats.total}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-3 sm:p-4 text-white">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs opacity-90">Rate</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{monthlyRate}%</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-3 sm:p-4 text-white">
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
                <div key={habit.id} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`${getCategoryColor(habit.category)} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                      {habit.category}
                    </span>
                    <span className={`${getPriorityColor(habit.priority || 'Medium')} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                      {habit.priority || 'Medium'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1">{habit.name}</h3>
                  {habit.description && <p className="text-xs sm:text-sm text-gray-600 mb-4">{habit.description}</p>}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">{period} Progress</span>
                    <span className="font-semibold text-indigo-600">
                      {progress.completed}/{progress.total} evaluated days
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {progress.total > 0 ? `${progress.percentage}% complete` : 'No evaluated days yet'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistics Page */}
        {activePage === 'stats' && activeHabits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Award className="text-indigo-600" size={20} />
              Statistics Dashboard
            </h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-green-50 rounded-xl p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Completions</div>
                <div className="text-xl sm:text-3xl font-bold text-green-600 flex items-center gap-1 sm:gap-2">
                  <Target size={18} className="sm:w-6 sm:h-6" />
                  {totalCompletions}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg per Habit</div>
                <div className="text-xl sm:text-3xl font-bold text-purple-600">
                  {averageCompletion}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Habits on a Streak</div>
                <div className="text-xl sm:text-3xl font-bold text-indigo-600">
                  {habitsOnStreak}
                </div>
              </div>
            </div>

            {/* Month/Year Selector */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Monthly Overview</h3>
              
              <div className="bg-indigo-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base text-gray-700 font-semibold">
                    {monthNames[selectedDateObject.getMonth()]} {selectedDateObject.getFullYear()}
                  </span>
                  <span className="text-sm sm:text-base text-indigo-600 font-bold">
                    {selectedMonthData.completed}/{selectedMonthData.total} days
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-indigo-600 h-2 sm:h-3 rounded-full transition-all"
                    style={{ width: `${selectedMonthData.percentage}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">{selectedMonthData.percentage}% completion</p>
              </div>
            </div>

            {/* Activity Heatmap - Previous, Selected, and Next Month */}
            <div className="mb-4 sm:mb-6 max-w-2xl mx-auto">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Activity Calendar</h3>
              <div className="space-y-3">
                {calendarMonths.map(({ year, month, isSelected }) => {
                  const calendar = generateCalendarHeatmap(year, month);
                  const sizeClasses = isSelected
                    ? 'gap-1 text-xs sm:text-sm'
                    : 'gap-0.5 text-[10px] sm:text-xs';

                  return (
                    <div key={`${year}-${month}`} className={`rounded-xl border ${
                      isSelected ? 'max-w-md mx-auto border-indigo-200 bg-indigo-50 p-2 sm:p-3 shadow-sm' : 'max-w-xs mx-auto border-slate-100 bg-slate-50 p-1.5 opacity-85'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${isSelected ? 'text-indigo-800 text-sm sm:text-base' : 'text-slate-600 text-xs sm:text-sm'}`}>
                          {calendar.name} {calendar.year}
                        </span>
                        {isSelected && <span className="text-xs font-semibold text-indigo-600">Selected month</span>}
                      </div>
                      <div className={`grid grid-cols-7 ${sizeClasses} text-slate-500 mb-1`}>
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
                                day ? `${getHeatmapColor(day.percentage, day.total)} hover:ring-1 hover:ring-indigo-400` : 'bg-transparent'
                              }`}
                              onClick={() => day && (setSelectedDate(day.date), navigateToPage('habits'))}
                              disabled={!day}
                              aria-label={day ? `Open habits for ${day.date}: ${day.count} of ${day.total} completed` : undefined}
                              title={day ? `${day.date}: ${day.count}/${day.total} habits (${day.percentage}%)` : ''}
                            >
                              {day && <span className="text-white font-medium">{day.day}</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-3 text-xs text-gray-600 justify-center">
                <span>Poor</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-gray-100 rounded" />
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <div className="w-3 h-3 bg-orange-500 rounded" />
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <div className="w-3 h-3 bg-green-500 rounded" />
                </div>
                <span>Excellent</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Habits by Category</h3>
              <div className="space-y-2">
                {['Study', 'Coding', 'Health', 'Personal'].map(category => {
                  const categoryHabits = activeHabits.filter(h => h.category === category);
                  const count = categoryHabits.length;
                  if (count === 0) return null;
                  
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className={`${getCategoryColor(category)} text-white text-xs px-3 py-1 rounded-full font-semibold w-24 text-center`}>
                        {category}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div 
                          className={`${getCategoryColor(category)} h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold`}
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
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No active habits to summarize</h2>
            <p className="text-sm text-gray-600">Add or restore a habit to see this page’s insights.</p>
          </div>
        )}

        {activePage === 'habits' && (
        <>
        {/* Add Habit Button */}
        {!showAddForm && !editingHabit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-center gap-2 text-indigo-600 text-sm sm:text-base font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Plus size={20} />
            Add New Habit
          </button>
        )}

        {/* Add Habit Form */}
        {(showAddForm || editingHabit) && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h3>
            <input
              type="text"
              placeholder="Habit name (e.g., Study DSA for 1 hour)"
              value={editingHabit ? editingHabit.name : newHabit.name}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, name: e.target.value }) : setNewHabit({ ...newHabit, name: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={editingHabit ? editingHabit.category : newHabit.category}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, category: e.target.value }) : setNewHabit({ ...newHabit, category: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Study">Study</option>
              <option value="Coding">Coding</option>
              <option value="Health">Health</option>
              <option value="Personal">Personal</option>
            </select>
            <select
              value={editingHabit ? editingHabit.priority : newHabit.priority}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, priority: e.target.value }) : setNewHabit({ ...newHabit, priority: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <input
              type="text"
              placeholder="Description (optional)"
              value={editingHabit ? editingHabit.description : newHabit.description}
              onChange={(e) => editingHabit ? setEditingHabit({ ...editingHabit, description: e.target.value }) : setNewHabit({ ...newHabit, description: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-3">
              <button
                onClick={editingHabit ? updateHabit : addHabit}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                {editingHabit ? 'Save Changes' : 'Create Habit'}
              </button>
              <button
                onClick={() => editingHabit ? setEditingHabit(null) : setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {archivedHabit && (
          <div className="bg-gray-800 text-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between gap-3 text-sm">
            <span>Habit archived</span>
            <button
              onClick={() => restoreHabit(archivedHabit)}
              className="text-indigo-200 font-semibold hover:text-white transition-colors"
            >
              Undo
            </button>
          </div>
        )}

        {/* Habits List */}
        {activeHabits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🎯</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No active habits!</h3>
            <p className="text-sm sm:text-base text-gray-600">Click "Add New Habit" to start building better habits.</p>
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
                  className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 transition-all ${
                    completed ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <span className={`${getCategoryColor(habit.category)} text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold`}>
                          {habit.category}
                        </span>
                        <span className={`${getPriorityColor(habit.priority || 'Medium')} text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold`}>
                          {habit.priority || 'Medium'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-xs sm:text-sm text-gray-600">{habit.description}</p>
                      )}
                      
                      <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                        Current streak: {streak} completed {streak === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingHabit(habit)}
                        className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => archiveHabit(habit.id)}
                        className="text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors"
                      >
                        <Archive size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                    onClick={() => markHabitDone(habit.id)}
                    className={`flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                      completed
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Check size={18} className="sm:w-5 sm:h-5" />
                    {completed 
                      ? `Done ${isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}! ✓` 
                      : `Mark ${isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    }
                  </button>
                    <button
                      onClick={() => markHabitNotDone(habit.id)}
                      className={`flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                        notDone
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
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
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Archived Habits</h2>
            <div className="space-y-2">
              {archivedHabits.map(habit => (
                <div key={habit.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                  <div>
                    <div className="font-semibold text-gray-700">{habit.name}</div>
                    <div className="text-xs text-gray-500">Archived habit</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => restoreHabit(habit.id)}
                      className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => permanentlyDeleteHabit(habit.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
