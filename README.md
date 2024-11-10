# CleaniTT

CleaniTT is a web application designed to promote environmental awareness and community engagement through reporting and tracking waste materials. Users can submit reports of waste in their surroundings, view their impact statistics, and participate in a leaderboard system to encourage friendly competition.

### Features

- **User Registration and Login**: Secure user authentication with registration and login functionality.
- **Profile Management**: Users can view their profile, including their impact statistics and rank.
- **Report Submission**: Users can submit reports of waste with descriptions and photos, including geolocation data.
- **Interactive Map**: A map interface to visualize reported waste locations and clusters.
- **Leaderboard**: A competitive leaderboard showcasing users based on their contributions and points.
- **Responsive Design**: Mobile-friendly interface for easy access on various devices.

### Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap, Leaflet.js
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **APIs**: AJAX for asynchronous data fetching
- **Deployment**: Render.com for hosting the backend

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cleaniTT.git
   cd cleaniTT
   ```

2. Install dependencies for the backend:
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```
   MONGO_URI=your_mongodb_connection_string
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

5. Open the frontend in your browser:
   ```bash
   open frontend/index.html
   ```

### Usage

- Register a new account or log in to an existing account.
- Submit reports of waste in your area with descriptions and photos.
- View your profile to track your contributions and see your rank.
- Explore the leaderboard to see how you compare with other users.

### Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.
