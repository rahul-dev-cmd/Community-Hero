import React, { useState } from "react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (username: string, city: string) => void;
  noClose?: boolean;
}

export default function AuthModal({ onClose, onSuccess, noClose = false }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("New York");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password,
          city: isSignUp ? city : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Success
      const userCity = data.user.city || "New York";
      const userInfo = { username: data.user.username, city: userCity };
      localStorage.setItem("civic_user", JSON.stringify(userInfo));
      onSuccess(data.user.username, userCity);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 animate-fade-in font-mono">
      <div 
        className="w-full max-w-md bg-[#1c1613] text-[#ede0d9] border-4 border-[#92030f] p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)] relative overflow-hidden"
        style={{ backgroundImage: "radial-gradient(circle at top right, rgba(146, 3, 15, 0.1) 0%, transparent 60%)" }}
      >
        {/* Retro visual decors */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#92030f]"></div>
        <div className="absolute top-2 right-4 text-[9px] text-[#9b8e87] opacity-30 select-none">
          CIVIC_AUTH_v1.0
        </div>

        <div className="flex justify-between items-center mb-6 border-b border-[#4f453f] pb-3">
          <div>
            <h3 className="font-bold text-lg text-[#dec1af] uppercase tracking-wider">
              {isSignUp ? "REGISTRATION PROTOCOL" : "DISPATCH SIGN-IN"}
            </h3>
            <p className="text-[10px] text-[#9b8e87] mt-0.5">
              {isSignUp ? "CREATE SECURE CREDENTIALS" : "ESTABLISH SECURE LINK"}
            </p>
          </div>
          {!noClose && (
            <button 
              onClick={onClose}
              className="text-[#9b8e87] hover:text-[#ede0d9] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {error && (
          <div className="bg-[#92030f]/20 border border-[#92030f] text-[#ffb4ac] p-3 text-xs uppercase mb-4 tracking-wide font-semibold">
            &gt;&gt; ERROR: {error}
            {!isSignUp && error.toLowerCase().includes("invalid") && (
              <div className="mt-2 text-[10px] text-[#dec1af] font-normal normal-case leading-relaxed">
                * If you have not registered on this system yet, click <span className="underline font-bold text-[#ede0d9] cursor-pointer" onClick={() => { setIsSignUp(true); setError(null); }}>"SIGN UP"</span> below to register first.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#dec1af] uppercase tracking-wider mb-1.5">
              Username / Identity Code
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Officer_404"
              className="w-full bg-[#130d09] border-2 border-[#4f453f] p-2.5 text-sm text-[#ede0d9] focus:outline-none focus:border-[#dec1af] uppercase placeholder:text-[#4f453f]"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#dec1af] uppercase tracking-wider mb-1.5">
              Passphrase / Access Code
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#130d09] border-2 border-[#4f453f] p-2.5 pr-10 text-sm text-[#ede0d9] focus:outline-none focus:border-[#dec1af] placeholder:text-[#4f453f]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b8e87] hover:text-[#ede0d9] focus:outline-none p-1 cursor-pointer flex items-center justify-center transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-[#dec1af] uppercase tracking-wider mb-1.5">
                Operational City / District
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#130d09] border-2 border-[#4f453f] p-2.5 text-sm text-[#ede0d9] focus:outline-none focus:border-[#dec1af] uppercase cursor-pointer"
                disabled={loading}
              >
                <option value="New York">New York</option>
                <option value="Kolkata">Kolkata</option>
                <option value="London">London</option>
                <option value="Tokyo">Tokyo</option>
                <option value="Paris">Paris</option>
                <option value="Sydney">Sydney</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#92030f] hover:bg-red-700 disabled:bg-[#4f453f] text-[#F4EFE6] font-bold text-xs py-3 tracking-widest uppercase border-2 border-[#4f453f] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] transition-all active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">
              {isSignUp ? "how_to_reg" : "vpn_key"}
            </span>
            {loading ? "INITIALIZING..." : isSignUp ? "REGISTER ACCOUNT" : "AUTHENTICATE ACCESS"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-[#4f453f] pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setShowPassword(false);
            }}
            className="text-xs text-[#dec1af] hover:underline cursor-pointer tracking-wider uppercase"
          >
            {isSignUp ? "Already have an identity? Sign In" : "Need a dispatch identity? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
