import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [username, setUsername] = useState(localStorage.getItem('username') || null);
    const [branch, setBranch] = useState(localStorage.getItem('branch') || null);
    const [semester, setSemester] = useState(localStorage.getItem('semester') || null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            setUser({ token, role, username, branch, semester });
        } else {
            setUser(null);
        }
    }, [token, role, username, branch, semester]);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Login failed');
        }

        const data = await response.json();
        setToken(data.access_token);
        setRole(data.role);
        setUsername(data.username);
        if (data.branch) setBranch(data.branch);
        if (data.semester) setSemester(data.semester);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        if (data.branch) localStorage.setItem('branch', data.branch);
        if (data.semester) localStorage.setItem('semester', data.semester);
        
        if (data.role === 'faculty') {
            navigate('/faculty');
        } else {
            navigate('/student');
        }
    };

    const register = async (username, password, role, branch, semester) => {
        const payload = { username, password, role };
        if (branch) payload.branch = branch;
        if (semester) payload.semester = Number(semester);

        const response = await fetch('http://localhost:8000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Registration failed');
        }

        const data = await response.json();
        setToken(data.access_token);
        setRole(data.role);
        setUsername(data.username);
        if (data.branch) setBranch(data.branch);
        if (data.semester) setSemester(data.semester);

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        if (data.branch) localStorage.setItem('branch', data.branch);
        if (data.semester) localStorage.setItem('semester', data.semester);

        if (data.role === 'faculty') {
            navigate('/faculty');
        } else {
            navigate('/student');
        }
    };

    const logout = () => {
        setToken(null);
        setRole(null);
        setUsername(null);
        setBranch(null);
        setSemester(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('branch');
        localStorage.removeItem('semester');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, role, username, branch, semester, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
