import AuthManager from "./AuthManager";
import Login from "./Login";
import Register from "./Register";
import AppRouter from "./AppRouter";
import "./App.css";

/**
 * App - Entry point that wires the app hierarchy:
 *
 *   AuthManager
 *   ├── Login | Register  (when unauthenticated)
 *   └── AppRouter        (when authenticated)
 *       ├── Home
 *       ├── Explore
 *       ├── Chat
 *       ├── Profile
 *       └── PublicProfile
 */
function App() {
  return (
    <AuthManager
      Login={Login}
      Register={Register}
      Router={AppRouter}
    />
  );
}

export default App;
