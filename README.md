# MatchUp - Sports Tournament Management Platform

MatchUp is a comprehensive tournament management and fantasy gaming platform for pickleball and other sports tournaments. The platform combines live scoring, tournament management, and fantasy gaming features to deliver a complete solution for tournament organizers, players, referees, and fantasy players.

## Features

- **Tournament Management**: Create and manage tournaments with flexible team structures and configurations
- **Live Scoring**: Mobile-optimized interface for referees to score matches in real-time
- **Fantasy Gaming**: Create fantasy contests with customizable rules and prize structures
- **User Roles**: Support for multiple user roles (Player, Referee, Tournament Admin, Master Admin)
- **Mobile-First Design**: Responsive UI optimized for mobile devices but works on all screen sizes
- **Secure Authentication**: Google OAuth integration with role-based access control

## Getting Started

### Prerequisites

- Node.js 20.x or later
- MySQL 8.0 or later
- Prisma CLI

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd final-fantasy-app/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` to add your specific configuration values.

4. Initialize the database
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Visit `http://localhost:3000` in your browser

### Setting Up Admin Access

Before you can use the application, you need to set up at least one MASTER_ADMIN account:

1. Visit `http://localhost:3000/admin-setup` in your browser
2. Enter your email, username, and the admin key (defined in your .env file)
3. Click "Create Admin Account"
4. Once created, you can log in with Google using the same email

### User Roles and Authentication

MatchUp supports the following user roles:

- **USER**: Regular fantasy players (automatically approved)
- **PLAYER**: Tournament players (automatically approved)
- **REFEREE**: Match referees (requires admin approval)
- **TOURNAMENT_ADMIN**: Tournament organizers (requires admin approval)
- **MASTER_ADMIN**: Platform administrators with full access

When users register, they select their desired role:
- USER and PLAYER roles are automatically approved
- REFEREE and TOURNAMENT_ADMIN roles require approval from a MASTER_ADMIN

To approve new users with elevated roles:
1. Log in as a MASTER_ADMIN
2. Navigate to the User Approvals page
3. Review and approve pending users

## Creating a Tournament

As a TOURNAMENT_ADMIN:

1. Log in and navigate to Tournament Management
2. Click "Create Tournament"
3. Fill in the tournament details, add players, and set up teams if applicable
4. Configure tournament settings and schedule
5. Optionally, enable fantasy contests and live scoring
6. Publish the tournament

## Scoring Matches

As a REFEREE:

1. Log in and navigate to your assigned tournament
2. Select the match you will be scoring
3. Use the mobile-optimized scoring interface to update scores in real-time
4. Confirm final scores when the match is complete

## Fantasy Contests

As a USER or PLAYER:

1. Browse available fantasy contests
2. Join contests by paying entry fees
3. Create your fantasy team within the budget constraints
4. Select a captain and vice-captain
5. Track your team's performance on the leaderboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team at support@matchup.com
