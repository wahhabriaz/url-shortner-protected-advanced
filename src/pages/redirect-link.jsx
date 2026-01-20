import {storeClicks} from "@/db/apiClicks";
import {getLongUrl} from "@/db/apiUrls";
import useFetch from "@/hooks/use-fetch";
import {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {BarLoader} from "react-spinners";
import bcrypt from "bcryptjs";

const RedirectLink = () => {
  const {id} = useParams();

  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const {loading, data, error, fn} = useFetch(getLongUrl, id);

  const isProtected = useMemo(() => {
    return !!data?.is_protected && !!data?.password_hash;
  }, [data]);

  const {loading: loadingStats, fn: fnStats} = useFetch(storeClicks, {
    id: data?.id,
    originalUrl: data?.original_url,
  });

  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto redirect if NOT protected
  useEffect(() => {
    if (!loading && data && !isProtected) {
      fnStats(); // storeClicks will redirect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data, isProtected]);

  const handleUnlock = async () => {
    setPwError("");

    if (!password || password.trim().length < 4) {
      setPwError("Enter the correct password");
      return;
    }

    try {
      const ok = await bcrypt.compare(password.trim(), data.password_hash);
      if (!ok) {
        setPwError("Wrong password");
        return;
      }

      setUnlocked(true);
      await fnStats(); // redirects
    } catch (e) {
      console.error(e);
      setPwError("Something went wrong. Try again.");
    }
  };

  // Loading state
  if (loading || loadingStats) {
    return (
      <>
        <BarLoader width={"100%"} color="#36d7b7" />
        <br />
        Redirecting...
      </>
    );
  }

  // Not found / error
  if (error || (!loading && !data)) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg font-semibold">Link not found</div>
        <div className="opacity-70 text-sm mt-2">
          This short link doesn’t exist or is unavailable.
        </div>
      </div>
    );
  }

  // Protected link: ask for password
  if (isProtected && !unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-xl font-semibold">Protected link</div>
          <div className="opacity-70 text-sm mt-1">
            Enter password to continue.
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-4 w-full rounded-md border px-3 py-2 bg-transparent"
          />

          {pwError && (
            <div className="text-sm mt-2" style={{color: "#ff6b6b"}}>
              {pwError}
            </div>
          )}

          <button
            onClick={handleUnlock}
            className="mt-4 w-full rounded-md px-3 py-2"
            style={{background: "#ef4444", color: "white"}}
          >
            Unlock & Redirect
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default RedirectLink;
