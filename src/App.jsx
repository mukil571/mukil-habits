import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, TrendingUp, Calendar, BarChart3, Award, Target } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daily');
  const [showStats, setShowStats] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  useEffect(() => {
    loadHabits();
    
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadHabits();
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, []);

  const loadHabits = async () => {
    try {
      const result = await localStorage.getItem('mukil-habits');
      if (result && result.value) {
        setHabits(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No existing habits found, starting fresh');
    } finally {
      setIsLoading(false);
    }
  };

  const saveHabits = async (updatedHabits) => {
    try {
      await localStorage.setItem('mukil-habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
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
      createdAt: new Date().toISOString()
    };
    
    const updatedHabits = [...habits, habit];
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    setNewHabit({ name: '', category: 'Study', description: '', priority: 'Medium' });
    setShowAddForm(false);
  };

  const toggleCompletion = (habitId) => {
    const dateToUse = selectedDate;
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = habit.completions || [];
        const isCompleted = completions.includes(dateToUse);
        
        return {
          ...habit,
          completions: isCompleted 
            ? completions.filter(date => date !== dateToUse)
            : [...completions, dateToUse]
        };
      }
      return habit;
    });
    
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const deleteHabit = (habitId) => {
    const updatedHabits = habits.filter(h => h.id !== habitId);
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const isCompletedOnDate = (completions, date) => {
    return completions && completions.includes(date);
  };

  const isCompletedToday = (completions) => {
    const today = getLocalDateString();
    return completions && completions.includes(today);
  };

  const getWeeklyProgress = (completions) => {
    if (!completions) return { completed: 0, total: 7, percentage: 0 };
    
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let completed = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = getLocalDateString(date);
      if (completions.includes(dateStr)) {
        completed++;
      }
    }
    
    return {
      completed,
      total: 7,
      percentage: Math.round((completed / 7) * 100)
    };
  };

  const getMonthlyProgress = (completions) => {
    if (!completions) return { completed: 0, total: 0, percentage: 0 };
    
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let completed = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getLocalDateString(date);
      if (completions.includes(dateStr)) {
        completed++;
      }
    }
    
    return {
      completed,
      total: daysInMonth,
      percentage: Math.round((completed / daysInMonth) * 100)
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
    
    habits.forEach(habit => {
      const priority = habit.priority || 'Medium';
      const points = priority === 'High' ? 3 : priority === 'Medium' ? 2 : 1;
      maxPoints += points;
      
      if (isCompletedOnDate(habit.completions, date)) {
        earnedPoints += points;
      }
    });
    
    const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    return { earnedPoints, maxPoints, percentage };
  };

  const generateCalendarHeatmap = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const weeks = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;
    
    for (let j = firstDayOfWeek; j < 7 && dayCounter <= daysInMonth; j++) {
      const date = new Date(year, month, dayCounter);
      const dateStr = getLocalDateString(date);
      const completedCount = habits.filter(h => 
        h.completions && h.completions.includes(dateStr)
      ).length;
      
      const dayScore = calculateDailyScore(dateStr);
      
      week[j] = {
        day: dayCounter,
        date: dateStr,
        count: completedCount,
        total: habits.length,
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
        const completedCount = habits.filter(h => 
          h.completions && h.completions.includes(dateStr)
        ).length;
        
        const dayScore = calculateDailyScore(dateStr);
        
        week[j] = {
          day: dayCounter,
          date: dateStr,
          count: completedCount,
          total: habits.length,
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

  const getHeatmapColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-100';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const generateMonthData = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let completed = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getLocalDateString(date);
      const dayCompleted = habits.filter(h => 
        h.completions && h.completions.includes(dateStr)
      ).length;
      if (dayCompleted > 0) completed++;
    }
    
    return {
      completed,
      total: daysInMonth,
      percentage: Math.round((completed / daysInMonth) * 100)
    };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalCompletionsToday = habits.filter(h => isCompletedToday(h.completions)).length;
  const totalCompletionsOnSelectedDate = habits.filter(h => isCompletedOnDate(h.completions, selectedDate)).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((totalCompletionsToday / totalHabits) * 100) : 0;
  const selectedDateCompletionRate = totalHabits > 0 ? Math.round((totalCompletionsOnSelectedDate / totalHabits) * 100) : 0;

  const weeklyStats = habits.reduce((acc, habit) => {
    const progress = getWeeklyProgress(habit.completions);
    return {
      completed: acc.completed + progress.completed,
      total: acc.total + progress.total
    };
  }, { completed: 0, total: 0 });
  const weeklyRate = weeklyStats.total > 0 ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) : 0;

  const monthlyStats = habits.reduce((acc, habit) => {
    const progress = getMonthlyProgress(habit.completions);
    return {
      completed: acc.completed + progress.completed,
      total: acc.total + progress.total
    };
  }, { completed: 0, total: 0 });
  const monthlyRate = monthlyStats.total > 0 ? Math.round((monthlyStats.completed / monthlyStats.total) * 100) : 0;

  const sortedHabits = [...habits].sort((a, b) => {
    return getPriorityOrder(a.priority || 'Medium') - getPriorityOrder(b.priority || 'Medium');
  });

  const totalCompletions = habits.reduce((sum, h) => sum + (h.completions?.length || 0), 0);
  const averageCompletion = habits.length > 0 ? Math.round(totalCompletions / habits.length) : 0;

  const selectedMonthData = generateMonthData(selectedYear, selectedMonth);
  const selectedDateScore = calculateDailyScore(selectedDate);
  
  const calculateAverageScore = () => {
    if (habits.length === 0) return 0;
    
    const allCompletionDates = new Set();
    habits.forEach(habit => {
      if (habit.completions) {
        habit.completions.forEach(date => allCompletionDates.add(date));
      }
    });
    
    if (allCompletionDates.size === 0) return 0;
    
    let totalPercentage = 0;
    allCompletionDates.forEach(date => {
      const score = calculateDailyScore(date);
      totalPercentage += score.percentage;
    });
    
    return Math.round(totalPercentage / allCompletionDates.size);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                Welcome, <span className="text-indigo-600">Mukil</span>! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Building better habits, one day at a time</p>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-indigo-100 text-indigo-600 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <BarChart3 size={18} />
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'daily' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'weekly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === 'monthly' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Date Selector */}
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

          {/* Daily Score Display */}
          {habits.length > 0 && (
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
                    {habits.filter(h => (h.priority || 'Medium') === 'High' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {habits.filter(h => (h.priority || 'Medium') === 'High').length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Med (2)</div>
                  <div className="font-semibold text-yellow-600">
                    {habits.filter(h => (h.priority || 'Medium') === 'Medium' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {habits.filter(h => (h.priority || 'Medium') === 'Medium').length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-1">Low (1)</div>
                  <div className="font-semibold text-gray-600">
                    {habits.filter(h => (h.priority || 'Medium') === 'Low' && isCompletedOnDate(h.completions, selectedDate)).length}/
                    {habits.filter(h => (h.priority || 'Medium') === 'Low').length}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats Cards */}
          {viewMode === 'daily' && (
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
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsOnSelectedDate}/{totalHabits}</div>
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

          {viewMode === 'weekly' && (
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
                  <span className="text-xs opacity-90">Today</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsToday}/{totalHabits}</div>
              </div>
            </div>
          )}

          {viewMode === 'monthly' && (
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
                  <span className="text-xs opacity-90">Today</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCompletionsToday}/{totalHabits}</div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Dashboard */}
        {showStats && habits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              <Award className="text-indigo-600" size={20} />
              Statistics Dashboard
            </h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
            </div>

            {/* Month/Year Selector */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Monthly Overview</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-indigo-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base text-gray-700 font-semibold">
                    {monthNames[selectedMonth]} {selectedYear}
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

            {/* Activity Heatmap - Calendar Style for Selected Month */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Activity Calendar - {monthNames[selectedMonth]} {selectedYear}</h3>
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-xs text-gray-500 mb-1">
                  <div className="text-center">S</div>
                  <div className="text-center">M</div>
                  <div className="text-center">T</div>
                  <div className="text-center">W</div>
                  <div className="text-center">T</div>
                  <div className="text-center">F</div>
                  <div className="text-center">S</div>
                </div>
                {generateCalendarHeatmap().weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`aspect-square rounded flex items-center justify-center text-xs ${
                          day 
                            ? `${getHeatmapColor(day.percentage)} cursor-pointer hover:ring-1 hover:ring-indigo-400` 
                            : 'bg-transparent'
                        }`}
                        title={day ? `${day.date}: ${day.count}/${day.total} habits (${day.percentage}%)` : ''}
                      >
                        {day && <span className="text-white font-medium text-xs">{day.day}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs text-gray-600 justify-center">
                <span>Poor</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 rounded" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded" />
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded" />
                </div>
                <span>Excellent</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Habits by Category</h3>
              <div className="space-y-2">
                {['Study', 'Coding', 'Health', 'Personal'].map(category => {
                  const categoryHabits = habits.filter(h => h.category === category);
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
                          style={{ width: `${(count / habits.length) * 100}%` }}
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

        {/* Add Habit Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 flex items-center justify-center gap-2 text-indigo-600 text-sm sm:text-base font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Plus size={20} />
            Add New Habit
          </button>
        )}

        {/* Add Habit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Create New Habit</h3>
            <input
              type="text"
              placeholder="Habit name (e.g., Study DSA for 1 hour)"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={newHabit.category}
              onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Study">Study</option>
              <option value="Coding">Coding</option>
              <option value="Health">Health</option>
              <option value="Personal">Personal</option>
            </select>
            <select
              value={newHabit.priority}
              onChange={(e) => setNewHabit({ ...newHabit, priority: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-3">
              <button
                onClick={addHabit}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Create Habit
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🎯</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No habits yet!</h3>
            <p className="text-sm sm:text-base text-gray-600">Click "Add New Habit" to start building better habits.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sortedHabits.map(habit => {
              const completed = isCompletedOnDate(habit.completions, selectedDate);
              const totalCompletions = habit.completions?.length || 0;
              const weeklyProgress = getWeeklyProgress(habit.completions);
              const monthlyProgress = getMonthlyProgress(habit.completions);
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
                      
                      <div className="mt-2 sm:mt-3 space-y-2">
                        {viewMode === 'daily' && (
                          <p className="text-xs sm:text-sm text-gray-500">
                            Total completions: {totalCompletions}
                          </p>
                        )}
                        {viewMode === 'weekly' && (
                          <div>
                            <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                              <span className="text-gray-600">Weekly Progress</span>
                              <span className="font-semibold text-indigo-600">
                                {weeklyProgress.completed}/{weeklyProgress.total} days
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${weeklyProgress.percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{weeklyProgress.percentage}% complete</p>
                          </div>
                        )}
                        {viewMode === 'monthly' && (
                          <div>
                            <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                              <span className="text-gray-600">Monthly Progress</span>
                              <span className="font-semibold text-indigo-600">
                                {monthlyProgress.completed}/{monthlyProgress.total} days
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${monthlyProgress.percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{monthlyProgress.percentage}% complete</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => toggleCompletion(habit.id)}
                    className={`w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 ${
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;