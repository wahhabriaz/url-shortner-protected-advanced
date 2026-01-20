import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Card} from "./ui/card";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import Error from "./error";
import * as yup from "yup";
import useFetch from "@/hooks/use-fetch";
import {createUrl} from "@/db/apiUrls";
import {BeatLoader} from "react-spinners";
import {UrlState} from "@/context";
import {QRCode} from "react-qrcode-logo";

export function CreateLink() {
  const {user} = UrlState();
  const baseDomain = window.location.origin;
  const navigate = useNavigate();
  const ref = useRef();

  let [searchParams, setSearchParams] = useSearchParams();
  const longLink = searchParams.get("createNew");

  const [errors, setErrors] = useState({});
  const [formValues, setFormValues] = useState({
    title: "",
    longUrl: longLink ? longLink : "",
    customUrl: "",
    isProtected: false, // ✅ toggle
    password: "", // ✅ only used if isProtected is true
  });

  const schema = yup.object().shape({
    title: yup.string().required("Title is required"),
    longUrl: yup
      .string()
      .url("Must be a valid URL")
      .required("Long URL is required"),
    customUrl: yup.string(),
    isProtected: yup.boolean(),
    password: yup.string().when("isProtected", {
      is: true,
      then: (s) => s.required("Password is required").min(4, "Min 4 characters"),
      otherwise: (s) => s.notRequired(),
    }),
  });

  const handleChange = (e) => {
    const {id, value, type, checked} = e.target;

    setFormValues((prev) => {
      // If user turns OFF protection, clear password
      if (id === "isProtected") {
        return {
          ...prev,
          isProtected: checked,
          password: checked ? prev.password : "",
        };
      }

      return {
        ...prev,
        [id]: type === "checkbox" ? checked : value,
      };
    });
  };

  const {
    loading,
    error,
    data,
    fn: fnCreateUrl,
  } = useFetch(createUrl, {
    ...formValues,
    // ✅ only pass password when protected
    password: formValues.isProtected ? formValues.password : "",
    user_id: user.id,
  });

  useEffect(() => {
    if (error === null && data) {
      navigate(`/link/${data[0].id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, data]);

  const createNewLink = async () => {
    setErrors([]);
    try {
      await schema.validate(formValues, {abortEarly: false});

      const canvas = ref.current.canvasRef.current;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));

      await fnCreateUrl(blob);
    } catch (e) {
      const newErrors = {};
      e?.inner?.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  return (
    <Dialog
      defaultOpen={longLink}
      onOpenChange={(res) => {
        if (!res) setSearchParams({});
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">Create New Link</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bold text-2xl">Create New</DialogTitle>
        </DialogHeader>

        {formValues?.longUrl && (
          <QRCode ref={ref} size={250} value={formValues?.longUrl} />
        )}

        <Input
          id="title"
          placeholder="Short Link's Title"
          value={formValues.title}
          onChange={handleChange}
        />
        {errors.title && <Error message={errors.title} />}

        <Input
          id="longUrl"
          placeholder="Enter your Loooong URL"
          value={formValues.longUrl}
          onChange={handleChange}
        />
        {errors.longUrl && <Error message={errors.longUrl} />}

        <div className="flex items-center gap-2">
          <Card className="p-2">{baseDomain.replace(/\/$/, "")}</Card> /
          <Input
            id="customUrl"
            placeholder="Custom Link (optional)"
            value={formValues.customUrl}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Toggle row */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm opacity-80">Protect with password</div>
          <input
            id="isProtected"
            type="checkbox"
            checked={formValues.isProtected}
            onChange={handleChange}
            className="h-4 w-4"
          />
        </div>

        {/* ✅ Password only when toggled ON */}
        {formValues.isProtected && (
          <>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={formValues.password}
              onChange={handleChange}
            />
            {errors.password && <Error message={errors.password} />}
          </>
        )}

        {error && <Error message={errors.message} />}

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="destructive"
            onClick={createNewLink}
            disabled={loading}
          >
            {loading ? <BeatLoader size={10} color="white" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
