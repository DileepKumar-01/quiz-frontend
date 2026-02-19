import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [role, setRole] = useState("student");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!regNo.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // ✅ FIXED ROUTE HERE
      const response = await api.post("/auth/login", {
  regNo: regNo.trim(),
  password: password.trim(),
  role
});


      const data = response.data;
      console.log("LOGIN SUCCESS:", data);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "teacher") {
          navigate("/teacherdashboard", { replace: true });
        } else if (data.user.role === "student") {
          navigate("/studentdashboard", { replace: true });
        } else {
          alert("Unknown role assigned to user");
        }
      }
    } catch (error) {
      console.error("Login Error:", error);

      const message =
        error.response?.data?.message ||
        "Server Error: Backend unreachable";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.input}
            disabled={loading}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <input
            type="text"
            placeholder={
              role === "student"
                ? "Enter Registration Number"
                : "Enter Teacher ID"
            }
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            style={styles.input}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4"
  },
  box: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "320px",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#6c5ce7",
    color: "white",
    border: "none",
    borderRadius: "5px"
  }
};
