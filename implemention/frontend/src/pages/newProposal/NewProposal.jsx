import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";

import {
  BasicInfoStep,
  Stepper,
} from "../../components/newProposal/StepComponents";
import { steps } from "../../components/newProposal/constants";
import {
  fetchPincodesInRadius,
  formatMoney,
  geocodeAddress,
} from "../../components/newProposal/helpers";
import {
  ImageStep,
  LocationStep,
  ReviewStep,
} from "../../components/newProposal/StepSections";
import { uploadImage } from "../../cloudinary";
import { uploadMetadataToIpfs } from "../../utils/ipfs";
import { useCreateProposal } from "../../hooks/useCreateProposal";

const NewProposal = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    disasterName: "",
    fundsRequested: "",
    description: "",
    locationSearch: "",
    locationDisplayName: "",
    latitude: null,
    longitude: null,
    radius: "",
    addressLine: "",
    imageFile: null,
  });

  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [cloudinaryResponse, setCloudinaryResponse] = useState(null);
  const [cloudinaryError, setCloudinaryError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [ipfsMetadataUri, setIpfsMetadataUri] = useState("");
  const [ipfsUploadError, setIpfsUploadError] = useState("");
  const [isUploadingIpfsMetadata, setIsUploadingIpfsMetadata] = useState(false);
  const [lastUploadedIpfsKey, setLastUploadedIpfsKey] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const [pincodes, setPincodes] = useState([]);
  const [isLoadingPincodes, setIsLoadingPincodes] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const {
    createProposal,
    isPending: isCreatingProposal,
    isConfirming: isConfirmingProposal,
    isVerifying: isVerifyingProposal,
  } = useCreateProposal();

  useEffect(() => {
    if (!form.imageFile) {
      setImagePreviewUrl("");
      setCloudinaryResponse(null);
      setCloudinaryError("");
      setIpfsMetadataUri("");
      setIpfsUploadError("");
      setIsUploadingIpfsMetadata(false);
      setLastUploadedIpfsKey("");
      return;
    }

    const url = URL.createObjectURL(form.imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imageFile]);

  useEffect(() => {
    const descriptionText = form.description.trim();
    const imageUrl = cloudinaryResponse?.secure_url || "";

    if (!descriptionText || !imageUrl) {
      if (!imageUrl) {
        setIpfsMetadataUri("");
        setLastUploadedIpfsKey("");
      }
      setIpfsUploadError("");
      setIsUploadingIpfsMetadata(false);
      return;
    }

    const uploadKey = `${descriptionText}::${imageUrl}`;
    if (uploadKey === lastUploadedIpfsKey) {
      return;
    }

    let cancelled = false;
    setIsUploadingIpfsMetadata(true);
    setIpfsUploadError("");

    uploadMetadataToIpfs({
      descriptionText,
      imageUrl,
    })
      .then((uri) => {
        if (cancelled) return;
        setIpfsMetadataUri(uri);
        setLastUploadedIpfsKey(uploadKey);
        setIpfsUploadError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setIpfsUploadError(err.message || "Failed to upload metadata to IPFS");
      })
      .finally(() => {
        if (!cancelled) {
          setIsUploadingIpfsMetadata(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    form.description,
    form.disasterName,
    cloudinaryResponse?.secure_url,
    lastUploadedIpfsKey,
  ]);

  useEffect(() => {
    if (!form.imageFile || !(form.imageFile instanceof File)) {
      return;
    }

    let cancelled = false;
    setIsUploadingImage(true);
    setCloudinaryError("");
    setCloudinaryResponse(null);

    uploadImage(form.imageFile)
      .then((data) => {
        if (!cancelled) {
          setCloudinaryResponse(data);
          setCloudinaryError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCloudinaryResponse(null);
          setCloudinaryError(err.message || "Upload failed");
        }
      })
      .finally(() => {
        if (!cancelled) setIsUploadingImage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.imageFile]);

  const updateForm = (updates) =>
    setForm((prev) => ({
      ...prev,
      ...updates,
    }));

  const basicInfoValid = useMemo(() => {
    const amount = Number(form.fundsRequested);
    return (
      form.disasterName.trim().length >= 3 &&
      Number.isFinite(amount) &&
      amount > 0 &&
      form.description.trim().length >= 10
    );
  }, [form.description, form.disasterName, form.fundsRequested]);

  const locationValid = useMemo(() => {
    const radius = Number(form.radius);
    return (
      Number.isFinite(form.latitude) &&
      Number.isFinite(form.longitude) &&
      Number.isFinite(radius) &&
      radius > 0
    );
  }, [form.latitude, form.longitude, form.radius]);

  const imageValid = useMemo(() => {
    return form.imageFile instanceof File;
  }, [form.imageFile]);

  const canGoNext = useMemo(() => {
    if (activeStep === 0) return basicInfoValid;
    if (activeStep === 1) return locationValid;
    if (activeStep === 2) return imageValid;
    return true;
  }, [activeStep, basicInfoValid, imageValid, locationValid]);

  const goToStep = (idx) => {
    setSubmitted(false);
    setActiveStep(idx);
    setMaxReachedStep((prev) => Math.max(prev, idx));
  };

  const handleNext = () => {
    if (!canGoNext) return;
    goToStep(Math.min(activeStep + 1, steps.length - 1));
  };

  const handleBack = () => {
    goToStep(Math.max(activeStep - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!ipfsMetadataUri) {
      toast.error("IPFS metadata is not ready yet. Please wait a moment.");
      return;
    }

    try {
      await createProposal({
        disasterName: form.disasterName,
        description: form.description,
        fundsRequested: Number(form.fundsRequested),
        locationSearch: form.locationSearch,
        locationDisplayName: form.locationDisplayName,
        latitude: form.latitude,
        longitude: form.longitude,
        radius: Number(form.radius),
        addressLine: form.addressLine,
        imageUrl: cloudinaryResponse?.secure_url || "",
        ipfsMetadataUri,
        pincodes,
      });
    } catch {
      // Errors are surfaced via toast in the hook
    }
  };

  const handleLocationSearch = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!form.locationSearch.trim()) {
      setLocationError("Please enter a location to search.");
      return;
    }

    setIsSearchingLocation(true);
    setLocationError("");
    try {
      const result = await geocodeAddress(form.locationSearch);
      updateForm({
        latitude: result.latitude,
        longitude: result.longitude,
        locationDisplayName: result.displayName,
      });
      setMapKey(Date.now());
    } catch {
      setLocationError("Could not find location. Try a different query.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const setLocationFromMap = (lat, lng) => {
    updateForm({ latitude: lat, longitude: lng });
    setLocationError("");
  };

  useEffect(() => {
    const radius = Number(form.radius);
    const hasValidInputs =
      Number.isFinite(form.latitude) &&
      Number.isFinite(form.longitude) &&
      Number.isFinite(radius) &&
      radius > 0;

    if (!hasValidInputs) {
      setPincodes([]);
      setPincodeError("");
      setIsLoadingPincodes(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingPincodes(true);
      setPincodeError("");

      try {
        const codes = await fetchPincodesInRadius(
          form.latitude,
          form.longitude,
          radius,
          controller.signal,
        );
        setPincodes(codes);
      } catch (error) {
        if (error.name === "AbortError") return;
        setPincodes([]);
        setPincodeError("Could not fetch pincodes for this area right now.");
      } finally {
        setIsLoadingPincodes(false);
      }
    }, 650);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.latitude, form.longitude, form.radius]);

  const reviewData = useMemo(() => {
    return {
      "Disaster name": form.disasterName || "—",
      "Funds requested": form.fundsRequested
        ? formatMoney(form.fundsRequested)
        : "—",
      Description: form.description || "—",
      Coordinates:
        Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
          ? `${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}`
          : "—",
      "Radius (km)": form.radius || "—",
      "Pincodes in radius": pincodes.length ? `${pincodes.length} found` : "—",
      "Resolved location": form.locationDisplayName || "—",
      Address: form.addressLine || "—",
      "Image file": form.imageFile?.name || "—",
      "Cloudinary URL": cloudinaryResponse?.secure_url || "—",
      "IPFS Metadata URI": ipfsMetadataUri || "—",
    };
  }, [form, pincodes.length, cloudinaryResponse, ipfsMetadataUri]);

  return (
    <div className="starfield min-h-screen bg-slate-950 text-slate-100">
      <main className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center px-4 pb-20 pt-8 sm:px-6">
        <div className="w-full max-w-4xl flex-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur sm:p-8">
            <Stepper
              steps={steps}
              activeIndex={activeStep}
              maxReachedIndex={maxReachedStep}
              onStepClick={(idx) => {
                if (idx <= maxReachedStep) goToStep(idx);
              }}
            />

            <form onSubmit={handleSubmit} className="flex flex-col">
              {activeStep === 0 ? (
                <BasicInfoStep
                  form={form}
                  updateForm={updateForm}
                  basicInfoValid={basicInfoValid}
                  formattedFundsRequested={formatMoney(form.fundsRequested)}
                />
              ) : null}

              {activeStep === 1 ? (
                <LocationStep
                  form={form}
                  updateForm={updateForm}
                  handleLocationSearch={handleLocationSearch}
                  isSearchingLocation={isSearchingLocation}
                  locationError={locationError}
                  mapKey={mapKey}
                  setLocationFromMap={setLocationFromMap}
                  isLoadingPincodes={isLoadingPincodes}
                  pincodeError={pincodeError}
                  pincodes={pincodes}
                  locationValid={locationValid}
                />
              ) : null}

              {activeStep === 2 ? (
                <ImageStep
                  form={form}
                  updateForm={updateForm}
                  imagePreviewUrl={imagePreviewUrl}
                  isUploadingImage={isUploadingImage}
                  cloudinaryResponse={cloudinaryResponse}
                  cloudinaryError={cloudinaryError}
                  imageValid={imageValid}
                />
              ) : null}

              {activeStep === 3 ? (
                <ReviewStep
                  reviewData={reviewData}
                  imagePreviewUrl={imagePreviewUrl}
                  submitted={submitted}
                  isUploadingIpfsMetadata={isUploadingIpfsMetadata}
                  ipfsUploadError={ipfsUploadError}
                  ipfsMetadataUri={ipfsMetadataUri}
                />
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-orange-400/50 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>

                {activeStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <span aria-hidden="true">&gt;</span>
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewProposal;
