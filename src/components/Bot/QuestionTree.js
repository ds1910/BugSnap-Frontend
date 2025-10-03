// Question Tree Structure for BugSnap AI Chatbot
// This defines all possible questions users can ask, organized in a tree structure

export const QUESTION_TREE = {
  // Main Categories
  MAIN_CATEGORIES: [
    {
      id: 'bugs',
      title: '🐛 Bug Management',
      description: 'Manage and track bugs in your projects',
      icon: 'bug',
      color: '#ef4444'
    },
    {
      id: 'teams',
      title: '👥 Team Management', 
      description: 'Manage team members and collaboration',
      icon: 'users',
      color: '#3b82f6'
    },
    {
      id: 'users',
      title: '👤 User Operations',
      description: 'User profiles and assignments',
      icon: 'user',
      color: '#10b981'
    },
    {
      id: 'analytics',
      title: '📊 Analytics & Reports',
      description: 'View insights and project analytics',
      icon: 'chart',
      color: '#8b5cf6'
    },
    {
      id: 'files',
      title: '📁 File Management',
      description: 'Manage attachments and documents',
      icon: 'folder',
      color: '#f59e0b'
    },
    {
      id: 'comments',
      title: '💬 Comments & Communication',
      description: 'Track comments and discussions',
      icon: 'message',
      color: '#06b6d4'
    }
  ],

  // Bug Management Questions Tree
  BUGS: {
    // Level 1: Main bug categories
    BASIC_OPERATIONS: {
      title: 'Basic Bug Operations',
      questions: [
        'Show all bugs',
        'List my assigned bugs', 
        'Create a new bug',
        'Find recent bugs',
        'Show bug statistics'
      ],
      followUp: 'BUG_DETAILS'
    },
    
    FILTERING: {
      title: 'Filter & Search Bugs',
      questions: [
        'Filter bugs by status',
        'Filter bugs by priority',
        'Filter bugs by assignee',
        'Search bugs by keyword',
        'Filter bugs by date range'
      ],
      followUp: 'BUG_FILTERS'
    },
    
    ANALYSIS: {
      title: 'Bug Analysis',
      questions: [
        'Bug trends analysis',
        'Priority distribution',
        'Team performance on bugs',
        'Bug resolution time',
        'Most common bug types'
      ],
      followUp: 'BUG_ANALYTICS'
    },

    // Level 2: Detailed filters
    BUG_FILTERS: {
      STATUS: {
        title: 'Select Bug Status',
        options: ['Open', 'In Progress', 'Resolved', 'Closed'],
        allowMultiple: true,
        next: 'BUG_PRIORITY_FILTER'
      },
      PRIORITY: {
        title: 'Select Bug Priority',
        options: ['Low', 'Medium', 'High', 'Critical'],
        allowMultiple: true,
        next: 'BUG_ASSIGNEE_FILTER'
      },
      ASSIGNEE: {
        title: 'Select Assignee',
        options: 'DYNAMIC_USERS', // Will be populated from backend
        allowMultiple: true,
        next: 'BUG_DATE_FILTER'
      },
      DATE_RANGE: {
        title: 'Select Date Range',
        options: ['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range'],
        allowCustom: true,
        next: 'EXECUTE_BUG_QUERY'
      }
    },

    // Level 3: Specific bug operations
    BUG_DETAILS: {
      title: 'What would you like to know?',
      questions: [
        'Show bug details',
        'View bug history',
        'See bug comments',
        'Check bug attachments',
        'View assigned users',
        'Update bug status',
        'Change bug priority',
        'Add comment to bug'
      ]
    }
  },

  // Team Management Questions Tree
  TEAMS: {
    BASIC_OPERATIONS: {
      title: 'Team Operations',
      questions: [
        'Show my teams',
        'List all teams',
        'Create new team',
        'Find team members',
        'Team statistics'
      ],
      followUp: 'TEAM_DETAILS'
    },
    
    MANAGEMENT: {
      title: 'Team Management',
      questions: [
        'Add team member',
        'Remove team member',
        'Change member role',
        'Team permissions',
        'Team settings'
      ],
      followUp: 'TEAM_ACTIONS'
    },
    
    ANALYTICS: {
      title: 'Team Analytics',
      questions: [
        'Team performance metrics',
        'Member activity analysis',
        'Team bug statistics',
        'Collaboration insights',
        'Team productivity trends'
      ],
      followUp: 'TEAM_REPORTS'
    },

    TEAM_DETAILS: {
      title: 'Team Information',
      questions: [
        'Team member list',
        'Team roles and permissions',
        'Team recent activity',
        'Team bug assignments',
        'Team creation date'
      ]
    }
  },

  // User Operations Questions Tree
  USERS: {
    PROFILE: {
      title: 'User Profile',
      questions: [
        'Show my profile',
        'Update profile information',
        'Change profile picture',
        'View my activity',
        'My account settings'
      ]
    },
    
    ASSIGNMENTS: {
      title: 'User Assignments',
      questions: [
        'My assigned bugs',
        'My created bugs',
        'My team memberships',
        'My recent comments',
        'My uploaded files'
      ]
    },
    
    SEARCH: {
      title: 'Find Users',
      questions: [
        'Search users by name',
        'Find users in team',
        'Users with admin role',
        'Most active users',
        'Recently joined users'
      ]
    }
  },

  // Analytics & Reports Questions Tree
  ANALYTICS: {
    OVERVIEW: {
      title: 'Project Overview',
      questions: [
        'Project dashboard',
        'Overall statistics',
        'Recent activity summary',
        'Key metrics overview',
        'Performance indicators'
      ]
    },
    
    BUG_ANALYTICS: {
      title: 'Bug Analytics',
      questions: [
        'Bug creation trends',
        'Bug resolution rates',
        'Priority distribution chart',
        'Status breakdown',
        'Average resolution time',
        'Bug hotspots analysis'
      ]
    },
    
    TEAM_ANALYTICS: {
      title: 'Team Analytics',
      questions: [
        'Team productivity metrics',
        'Member contribution analysis',
        'Team collaboration patterns',
        'Cross-team bug distribution',
        'Team growth statistics'
      ]
    },
    
    TIME_BASED: {
      title: 'Time-based Reports',
      questions: [
        'Daily activity report',
        'Weekly summary',
        'Monthly trends',
        'Quarterly analysis',
        'Year-over-year comparison'
      ]
    }
  },

  // File Management Questions Tree  
  FILES: {
    BASIC: {
      title: 'File Operations',
      questions: [
        'List all files',
        'Recent uploads',
        'My uploaded files',
        'Files by type',
        'Large files report'
      ]
    },
    
    SEARCH: {
      title: 'Find Files',
      questions: [
        'Search files by name',
        'Find files in bug',
        'Files uploaded by user',
        'Files in date range',
        'Files by size'
      ]
    }
  },

  // Comments & Communication Questions Tree
  COMMENTS: {
    BASIC: {
      title: 'Comment Operations',
      questions: [
        'Recent comments',
        'My comments',
        'Comments on bug',
        'Comments by user',
        'Unread comments'
      ]
    },
    
    ANALYSIS: {
      title: 'Comment Analysis',
      questions: [
        'Most commented bugs',
        'Comment activity trends',
        'User comment statistics',
        'Comment frequency analysis',
        'Discussion hotspots'
      ]
    }
  }
};

// Quick Actions - Most commonly used queries
export const QUICK_ACTIONS = [
  {
    id: 'my-bugs',
    title: 'My Assigned Bugs',
    query: 'show my assigned bugs',
    icon: 'bug',
    color: '#ef4444'
  },
  {
    id: 'create-bug',
    title: 'Create New Bug',
    query: 'create a new bug',
    icon: 'plus',
    color: '#10b981'
  },
  {
    id: 'team-status',
    title: 'Team Overview',
    query: 'show team statistics',
    icon: 'users',
    color: '#3b82f6'
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    query: 'show recent activity',
    icon: 'clock',
    color: '#8b5cf6'
  },
  {
    id: 'high-priority',
    title: 'High Priority Bugs',
    query: 'show high priority bugs',
    icon: 'alert-triangle',
    color: '#f59e0b'
  },
  {
    id: 'dashboard',
    title: 'Project Dashboard',
    query: 'show project dashboard',
    icon: 'chart',
    color: '#06b6d4'
  }
];

// Smart suggestions based on user context
export const CONTEXTUAL_SUGGESTIONS = {
  // When user has unassigned bugs
  UNASSIGNED_BUGS: [
    'Show unassigned bugs',
    'Assign bugs to team members',
    'Set priority for unassigned bugs'
  ],
  
  // When user has overdue bugs
  OVERDUE_BUGS: [
    'Show overdue bugs',
    'Extend due dates',
    'Update status of overdue bugs'
  ],
  
  // When user is team admin
  ADMIN_ACTIONS: [
    'Team performance report',
    'Add new team member',
    'Review team permissions'
  ],
  
  // When user just joined
  NEW_USER: [
    'Show my profile',
    'View my teams',
    'How to create a bug'
  ]
};

// Response templates for different query types
export const RESPONSE_TEMPLATES = {
  BUG_LIST: {
    title: 'Bug List Results',
    format: 'table',
    columns: ['title', 'status', 'priority', 'assignee', 'created'],
    actions: ['view', 'edit', 'assign', 'comment']
  },
  
  TEAM_INFO: {
    title: 'Team Information',
    format: 'card',
    sections: ['members', 'stats', 'recent_activity'],
    actions: ['view_members', 'add_member', 'settings']
  },
  
  ANALYTICS: {
    title: 'Analytics Dashboard',
    format: 'dashboard',
    widgets: ['charts', 'metrics', 'trends'],
    actions: ['export', 'filter', 'details']
  }
};