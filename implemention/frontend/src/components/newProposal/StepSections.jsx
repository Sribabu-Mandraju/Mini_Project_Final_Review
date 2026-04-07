import { MapContainer, TileLayer } from "react-leaflet";

import { defaultCenter, defaultZoom, inputClassName } from "./constants";
import MapLocationController from "./MapLocationController";
import { Field, ReviewGrid, SectionCard } from "./StepComponents";

export const LocationStep = ({
  form,
  updateForm,
  handleLocationSearch,
  isSearchingLocation,
  locationError,
  mapKey,
  setLocationFromMap,
  isLoadingPincodes,
  pincodeError,
  pincodes,
  locationValid,
}) => (
  <SectionCard
    stepNumber={2}
    totalSteps={4}
    title="Location"
    subtitle="Search or click on map to set coordinates and affected radius."
  >
    <div className="space-y-5">
      <Field label="Search Location" hint="Example: Chennai, Tamil Nadu, India">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={form.locationSearch}
            onChange={(e) => updateForm({ locationSearch: e.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleLocationSearch();
              }
            }}
            placeholder="Search area..."
            className={inputClassName}
          />
          <button
            type="button"
            onClick={handleLocationSearch}
            disabled={isSearchingLocation}
            className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearchingLocation ? "Searching..." : "Search"}
          </button>
        </div>
        {locationError ? (
          <p className="mt-2 text-sm text-rose-300">{locationError}</p>
        ) : null}
        {form.locationDisplayName ? (
          <p className="mt-2 text-xs text-emerald-300">
            Found: {form.locationDisplayName}
          </p>
        ) : null}
      </Field>
    </div>

    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <Field label="Radius (km)">
        <input
          value={form.radius}
          onChange={(e) =>
            updateForm({
              radius: e.target.value.replace(/[^\d.]/g, ""),
            })
          }
          inputMode="decimal"
          placeholder="e.g., 10"
          className={inputClassName}
        />
      </Field>
      <Field label="Address / Notes (Optional)">
        <input
          value={form.addressLine}
          onChange={(e) => updateForm({ addressLine: e.target.value })}
          placeholder="Landmark or notes..."
          className={inputClassName}
        />
      </Field>
    </div>

    <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
      <MapContainer
        key={mapKey}
        center={
          Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
            ? [form.latitude, form.longitude]
            : defaultCenter
        }
        zoom={
          Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
            ? 10
            : defaultZoom
        }
        style={{ height: "360px", width: "100%" }}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapLocationController
          center={
            Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
              ? {
                  latitude: form.latitude,
                  longitude: form.longitude,
                }
              : null
          }
          radius={Number(form.radius) || 0}
          disasterName={form.disasterName}
          onLocationSelect={setLocationFromMap}
        />
      </MapContainer>
    </div>

    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
      Coordinates:{" "}
      {Number.isFinite(form.latitude) && Number.isFinite(form.longitude)
        ? `${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}`
        : "Not selected"}
    </div>

    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-300">
      <div className="font-semibold text-slate-200">Pincodes within selected radius</div>
      {isLoadingPincodes ? (
        <p className="mt-2 text-slate-400">Fetching pincodes for this area...</p>
      ) : pincodeError ? (
        <p className="mt-2 text-rose-300">{pincodeError}</p>
      ) : pincodes.length > 0 ? (
        <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
          {pincodes.map((pincode) => (
            <span
              key={pincode}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-200"
            >
              {pincode}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-slate-400">
          No pincodes found yet. Select a location and valid radius.
        </p>
      )}
    </div>

    {!locationValid ? (
      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Select a location and set radius greater than 0 to continue.
      </div>
    ) : null}
  </SectionCard>
);

export const ImageStep = ({
  form,
  updateForm,
  imagePreviewUrl,
  isUploadingImage,
  cloudinaryResponse,
  cloudinaryError,
  imageValid,
}) => (
  <SectionCard
    stepNumber={3}
    totalSteps={4}
    title="Image"
    subtitle="Upload a supporting image (damage evidence, on-ground verification, etc.)."
  >
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-5">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-slate-200">Upload Image</div>
          <p className="text-sm text-slate-400">
            PNG/JPG recommended. Keep it under a few MB for faster reviews.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              updateForm({
                imageFile: e.target.files?.[0] || null,
              })
            }
            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-orange-400"
          />
          {form.imageFile ? (
            <button
              type="button"
              onClick={() => updateForm({ imageFile: null })}
              className="self-start rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-orange-400/60 hover:text-orange-200"
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5">
        <div className="text-sm font-semibold text-slate-200">Preview</div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          {imagePreviewUrl ? (
            <img
              src={cloudinaryResponse?.secure_url || imagePreviewUrl}
              alt="Uploaded preview"
              className="h-48 w-full object-cover sm:h-64"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500 sm:h-64">
              No image selected yet.
            </div>
          )}
        </div>
        {isUploadingImage ? (
          <p className="mt-3 text-sm text-orange-300">Uploading to Cloudinary…</p>
        ) : null}
        {cloudinaryResponse && !isUploadingImage ? (
          <p className="mt-3 text-xs text-emerald-400">Uploaded to Cloudinary.</p>
        ) : null}
      </div>
    </div>

    {cloudinaryError ? (
      <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {cloudinaryError}
      </div>
    ) : null}

    {cloudinaryResponse ? (
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold text-slate-200">Cloudinary URL</div>
        <a
          href={cloudinaryResponse.secure_url}
          target="_blank"
          rel="noreferrer"
          className="block break-all rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-xs text-orange-300 underline underline-offset-2 hover:text-orange-200"
        >
          {cloudinaryResponse.secure_url}
        </a>
      </div>
    ) : null}

    {!imageValid ? (
      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Upload an image to continue.
      </div>
    ) : null}
  </SectionCard>
);

export const ReviewStep = ({
  reviewData,
  imagePreviewUrl,
  submitted,
  isUploadingIpfsMetadata,
  ipfsUploadError,
  ipfsMetadataUri,
}) => (
  <SectionCard
    stepNumber={4}
    totalSteps={4}
    title="Review"
    subtitle="Confirm your proposal details before submitting."
  >
    <ReviewGrid reviewData={reviewData} />

    {imagePreviewUrl ? (
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
        <img
          src={imagePreviewUrl}
          alt="Final preview"
          className="h-56 w-full object-cover sm:h-64"
        />
      </div>
    ) : null}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-400">
        Submission will be handled in the next integration step
        (contract/IPFS/backend).
      </p>
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-amber-300"
      >
        Submit proposal
      </button>
    </div>

    {submitted ? (
      <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        Proposal submitted (demo). Check the browser console for the payload.
      </div>
    ) : null}

    {isUploadingIpfsMetadata ? (
      <div className="mt-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200">
        Uploading description + image URL metadata to IPFS...
      </div>
    ) : null}

    {ipfsUploadError ? (
      <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {ipfsUploadError}
      </div>
    ) : null}

    {ipfsMetadataUri ? (
      <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        IPFS metadata ready:{" "}
        <a
          href={`https://gateway.pinata.cloud/ipfs/${ipfsMetadataUri.replace(
            "ipfs://",
            "",
          )}`}
          target="_blank"
          rel="noreferrer"
          className="break-all underline underline-offset-2"
        >
          {ipfsMetadataUri}
        </a>
      </div>
    ) : null}
  </SectionCard>
);
