import { useState } from "react";
import api from "../services/api";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onResetPassword: (token: string) => void;
}

function ForgotPassword({
  onBackToLogin,
  onResetPassword,
}: ForgotPasswordProps) {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [resetToken, setResetToken] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setSuccess(
        response.data?.message ||
          "Reset token generated successfully."
      );

      const token =
        response.data?.reset_token;

      if (token) {
        setResetToken(token);
      }
    } catch (err: any) {
      console.error(
        "FORGOT PASSWORD ERROR:",
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
          "Failed to generate reset token."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 flex items-center justify-center">
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
              Forgot Password
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Enter your email address to generate a
              password reset token.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-md px-4 py-3">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-md px-4 py-3">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading
                ? "Generating..."
                : "Generate Reset Token"}
            </button>
          </form>

          {resetToken && (
            <div className="mt-6 border border-slate-200 rounded-md bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Development Reset Token
              </p>

              <div className="mt-2 break-all rounded-md border border-slate-300 bg-white p-3">
                <p className="text-sm text-slate-700 font-mono">
                  {resetToken}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onResetPassword(
                    resetToken
                  )
                }
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-medium transition"
              >
                Continue to Reset Password
              </button>
            </div>
          )}

          <div className="mt-7 border-t border-slate-200 pt-5 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
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

export default ForgotPassword;
