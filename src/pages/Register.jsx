import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import googleLogo from "../assets/google.png";
import api from "../api"; 

export default function Register() {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    id: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // Explicitly mapping formData.id to the 'id' key for the backend 
      const response = await api.post("/auth/register", { 
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        password: formData.password,
        role: role,
        id: formData.id // This matches 'id' in your authRoutes.js logic
      });

      if (response.status === 201 || response.status === 200) {
        alert("Registration Successful! Data saved to MongoDB.");
        navigate("/"); // Redirect to Login
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Server Error: Backend is not reachable";
      alert("Registration Failed: " + errorMsg);
      console.error("Register Error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Register</h2>
        <button style={styles.googleButton}>
          <img src={googleLogo} alt="Google" style={styles.googleIcon} />
          Sign up with Google
        </button>
        <div style={styles.divider}>OR</div>

        <form onSubmit={handleSubmit}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} style={styles.input} required />
          <input 
             type="text" 
             name="id" 
             placeholder={role === "student" ? "Registration Number" : "Teacher ID"} 
             value={formData.id} 
             onChange={handleChange} 
             style={styles.input} 
             required 
          />
          <input type="email" name="email" placeholder="Gmail Address" value={formData.email} onChange={handleChange} style={styles.input} required />
          <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} style={styles.input} required />
          
          <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input} required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={styles.input} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} style={styles.input} required />

          <button type="submit" style={styles.button}>Register</button>
        </form>
        <p>Already have an account? <Link to="/">Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f4" },
  box: { background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", width: "320px", textAlign: "center", overflowY: "auto", maxHeight: "95vh" },
  input: { width: "100%", padding: "10px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
  button: { width: "100%", padding: "10px", backgroundColor: "#6c5ce7", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  googleButton: { width: "100%", padding: "10px", marginBottom: "15px", backgroundColor: "#ffffff", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  googleIcon: { width: "20px", height: "20px" },
  divider: { marginBottom: "10px", fontSize: "13px", color: "#666" }
};