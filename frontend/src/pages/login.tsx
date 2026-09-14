import { useState } from "react";
import api from "../services/api";

interface LoginProps {
  onLogin: () => void;
  onRegister: () => void;
}

function Login({
  onLogin,
  onRegister,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const formData = new URLSearchParams();

      formData.append("username", email.trim());
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("Login response:", response.data);

      const token = response.data.access_token;

      if (!token) {
        setError("Login successful but token was not received.");
        return;
      }

      localStorage.setItem("token", token);

      onLogin();
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      if (error.response) {
        console.error(
          "Status:",
          error.response.status
        );

        console.error(
          "Backend:",
          error.response.data
        );

        const detail = error.response.data?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item: any) =>
                item.msg || "Invalid data"
              )
              .join(", ")
          );
        } else if (detail) {
          setError(String(detail));
        } else if (
          error.response.status === 401
        ) {
          setError(
            "Invalid email or password."
          );
        } else if (
          error.response.status === 422
        ) {
          setError(
            "Invalid login data. Check your email and password."
          );
        } else {
          setError(
            `Login failed (${error.response.status}).`
          );
        }
      } else if (error.request) {
        setError(
          "Backend server is not running. Start FastAPI first."
        );
      } else {
        setError(
          "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">
            SmartDocs
          </h1>

          <p className="text-gray-500 mt-2">
            Smart Document Platform
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Welcome Back
          </h2>

          <p className="text-gray-500 text-sm text-center mt-2 mb-7">
            Login to your SmartDocs account
          </p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          <div className="mt-6 text-center">

            <p className="text-sm text-gray-500">
              Don't have an account?
            </p>

            <button
              onClick={onRegister}
              className="mt-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Create an account
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;