# StockApp
An automated trading application with web interface.

Project Idea
A full stack web application for algorithmic swing trading. This application would use React that would interface with a django backend and postgres sql. This will automate algorithms for swing trading and bid on our behalf.  We would be using past trends for data modeling and graphically display the results in an interactive UI.

Basic User Requirements
As a user I want to be able to access this website from any platform so that I can check in on my investments anywhere
As a user I want to be able to create an account so that I can deposit, manage, and withdrawal my funds
As a user I want to be able to set the risk tolerance of my investments so that I can mitigate potential losses
As a user I want to choose a threshold to automatically withdrawal my investments so that I can obtain the maximum value from them
As a user I want to have the application manage my finances and investments so that I do not have to manually manage my investments
As a user I want to have a main dashboard where I can see my current investments and portfolio performance so that I can monitor the effectiveness of the automatic portfolio management
As a user I want to have the ability to see a log of trades for my portfolio so that I can see how the application is managing my funds
As a user I want to have the ability to stop automatic portfolio management and divest my holdings so that I can withdrawal my funds

Product Requirements
Platform Accessibility
Requirement: The website should be accessible from web browser
Details:
Web-based UI
Supported browsers: Chromium based browsers, Safari
Desktop only layout
Acceptance Criteria:
Users can access the website from any chromium based or safari browser
The website UI adapts to changing screen sizes
User Account Management
Requirement: The website shall allow users to create and manage an account to handle funds and investments
Details:
User registration, authentication, and session management
User ability to deposit funds, withdrawal funds, and view balances
Acceptance Criteria:
User can successfully create an account
User can login to their account
User can logout of their account
User deposits and withdrawals are accurately reflected in account balances
Risk Tolerance Configuration
Requirement: The website shall allow users to define a risk tolerance level for their investments
Details:
Risk level can be set to the following values [LOW, MEDIUM, HIGH]
Risk level directly affects portfolio allocation and trading strategy
Acceptance Criteria:
Risk tolerance level is editable by user and saved to their account
Portfolio behavior adjusts according to the selected risk level
Automated Withdrawal Thresholds
Requirement: The website shall allow users to define a threshold that will trigger automatic withdrawals
Details:
Threshold is set by the user and is a numeric value
Automatic execution when the threshold is reached with no manual intervention
Acceptance Criteria:
Withdrawals are triggered when the thresholds are met
Users receives notice on the dashboard when threshold triggers a withdrawal
Automated Portfolio Management
Requirement: The website shall automatically manage user investments based on a trading algorithm and predefined rules and strategies
Details:
Application continuously monitors the market conditions
Automated trade execution aligned with user’s set risk tolerance
No manual trading is allowed by the user
Acceptance Criteria:
Trades are executed without user intervention
Portfolio changes are consistent with user risk tolerance
User Manual Withdrawal
Requirement: The website shall allow a user to stop automatic portfolio management and divest the current holdings
Details:
User can click a button on the account management screen to divest all holdings and allow them to withdrawal their funds
Acceptance Criteria:
Holdings are divested upon clicking the button
User can withdrawal funds after divestment
Portfolio Dashboard
Requirement: The website shall provide a main dashboard summarizing portfolio status and performance
Details:
Shows current holdings, balances, and tick data
Shows performance metrics including gains and losses over time
Near real time updates (if possible)
Acceptance Criteria:
Dashboard reflects accurate and up to date portfolio data
Dashboard is the first screen to show when user enters the website
Trade History and Audit Log
Requirement: The website shall maintain a detailed log of all trades executed on behalf of the user. The user shall be able to view this log as a tab in the website.
Details:
Timestamped record of buys, sells, and withdrawals
Acceptance Criteria:
Users can view a complete chronological trade history
Logged data matches portfolio changes
