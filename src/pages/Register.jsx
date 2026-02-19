import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [step, setStep] = useState("form"); // form, verify
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    student_id: "",
    batch: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { signup, verifyOtp, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    navigate("/");
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Strict validation
    const allowedDomains = ["@edu.lnbti.lk", "@student.lnbti.lk",];
    const isValidDomain = allowedDomains.some((domain) =>
      formData.email.endsWith(domain)
    );

    if (!isValidDomain) {
      setMessage("Error: Only campus emails (@edu.lnbti.lk) are allowed.");
      setLoading(false);
      return;
    }

    try {
      // Send OTP
      await signup(formData.email, {
        name: formData.name,
        student_id: formData.student_id,
        batch: formData.batch,
      });
      setStep("verify");
      setMessage("Verification code sent to your email.");
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(formData.email, otp);
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
      <div className="w-full p-6 lg:px-12 flex justify-start">
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Join the Campus Trade network
            </p>
          </div>

          {step === "form" ? (
            <form className="mt-8 space-y-5" onSubmit={handleSignup}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider"
                  >
                    Campus Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="student@edu.lnbti.lk"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student_id"
                    className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider"
                  >
                    Student ID
                  </label>
                  <input
                    id="student_id"
                    name="student_id"
                    type="text"
                    required
                    value={formData.student_id}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="LNBTI/..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="batch"
                    className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider"
                  >
                    Batch / Year
                  </label>
                  <input
                    id="batch"
                    name="batch"
                    type="text"
                    required
                    value={formData.batch}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="Batch 01"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.01]"
                >
                  {loading ? "Sending Code..." : "Sign Up"}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleVerify}>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter the code sent to{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formData.email}
                    </span>
                  </p>
                </div>
                <div>
                  <label htmlFor="otp" className="sr-only">
                    Verification Code
                  </label>
                  <input
                    id="otp"
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
              </div>
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

          <div className="text-center mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
            <Link
              to="/login"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className="py-8 text-center bg-transparent">
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
