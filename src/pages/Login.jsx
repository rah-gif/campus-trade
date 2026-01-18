import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [step, setStep] = useState("email"); // email, verify
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { login, verifyOtp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Strict Domain Validation 
    const allowedDomains = ["@edu.lnbti.lk", "@student.lnbti.lk", ];
    const isValidDomain = allowedDomains.some((domain) =>
      email.endsWith(domain)
    );

    if (!isValidDomain) {
      setMessage("Error: Only campus emails (@edu.lnbti.lk) are allowed.");
      setLoading(false);
      return;
    }

    try {
      await login(email);
      setStep("verify");
      setMessage("Verification code sent! Check your email.");
    } catch (error) {
      if (error.message.includes("Signups not allowed")) {
        setMessage("Account not found. Please create an account first.");
      } else {
        setMessage("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate("/");
    } catch (error) {
      setMessage("Verification failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header / Logo Area */}
      <div className="relative z-10 w-full p-6 lg:px-12 flex justify-start">
        <Link
          to="/"
          className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2.5"
        >
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          CampusTrade
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your student portal
            </p>
          </div>

          {step === "email" ? (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="-space-y-px rounded-md shadow-sm">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="Student Email (e.g. user@edu.lnbti.lk)"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.01]"
                >
                  {loading ? "Sending Code..." : "Continue with Email"}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleVerify}>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please enter the verification code sent to <br />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {email}
                  </span>
                </p>
              </div>
              <div>
                <input
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-widest text-lg font-mono rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white border p-3 shadow-inner focus:border-indigo-500 focus:ring-indigo-500 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="12345678"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl border border-transparent bg-green-600 py-3 px-4 text-sm font-bold text-white hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all hover:scale-[1.01]"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </form>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm text-center ${
                message.startsWith("Error") ||
                message.startsWith("Verification failed")
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center mt-6 border-t border-gray-100 dark:border-gray-700 pt-6 flex flex-col items-center space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                New student?
              </p>
              <Link
                to="/register"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                Create your account
              </Link>
            </div>

            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-1 group"
            >
              Browse as Guest{" "}
              <span
                aria-hidden="true"
                className="group-hover:translate-x-0.5 transition-transform"
              >
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="relative z-10 py-8 text-center bg-transparent">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          &copy; {new Date().getFullYear()} CampusTrade. All rights reserved.
        </p>
        <div className="mt-3 flex justify-center space-x-6">
          <Link
            to="/privacy"
            className="text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:support@campus-trade.lnbti.lk"
            className="text-[10px] text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors"
          >
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}
