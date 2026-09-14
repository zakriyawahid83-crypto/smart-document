import { useState } from "react";
import api from "../services/api";

interface RegisterProps {
  onRegisterSuccess: (token: string) => void;
  onLogin: () => void;
}

function Register({
  onRegisterSuccess,
  onLogin,
}: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/register",
        {
          name: name.trim(),
          email: email.trim(),
          password,
        }
      );

      const verificationToken =
        response.data?.verification_token;

      if (!verificationToken) {
        setError(
          "Account was created, but no verification token was returned."
        );
        return;
      }

      setSuccess(
        "Account created successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onRegisterSuccess(
          verificationToken
        );
      }, 800);
    } catch (err: any) {
      console.error(
        "REGISTER ERROR:",
        err
      );

      const detail =
        err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item: any) =>
                item.msg
            )
            .join(", ")
        );
      } else if (detail) {
        setError(String(detail));
      } else {
        setError(
          "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-md">

        <div className="text-center mb-7">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
            SmartDocs
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Document Management Platform
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">
              Create Account
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Create your account to start managing documents.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-700">
                {success}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
                autoComplete="name"
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                Minimum 6 characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?
            </p>

            <button
              type="button"
              onClick={onLogin}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          SmartDocs — Simple document management
        </p>
      </div>
    </div>
  );
}

export default Register;
