import { MapContainer, TileLayer } from "react-leaflet";
import { FiMapPin } from "react-icons/fi";

import MapLocationController from "../../components/newProposal/MapLocationController";
import { defaultZoom } from "../../components/newProposal/constants";

const CampaignAffectedArea = ({ campaign, center }) => {
  if (!campaign) return null;

  const campaignData = campaign.proposalId?.campaign;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <FiMapPin className="h-5 w-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-white">Affected Area</h2>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        This campaign covers a {campaignData?.radius || "N/A"} km radius around
        the following location:
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
        <MapContainer
          center={center}
          zoom={
            campaignData &&
            Number.isFinite(campaignData.latitude) &&
            Number.isFinite(campaignData.longitude)
              ? 10
              : defaultZoom
          }
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapLocationController
            center={
              campaignData &&
              Number.isFinite(campaignData.latitude) &&
              Number.isFinite(campaignData.longitude)
                ? {
                    latitude: campaignData.latitude,
                    longitude: campaignData.longitude,
                  }
                : null
            }
            radius={Number(campaignData?.radius) || 0}
            disasterName={campaign.title}
            onLocationSelect={null}
          />
        </MapContainer>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        {campaignData?.latitude && campaignData?.longitude && (
          <div>
            <span className="font-semibold">Coordinates:</span>{" "}
            {campaignData.latitude.toFixed(4)},{" "}
            {campaignData.longitude.toFixed(4)}
          </div>
        )}
        {campaignData?.radius && (
          <div>
            <span className="font-semibold">Coverage Radius:</span>{" "}
            {campaignData.radius} km
          </div>
        )}
      </div>
    </article>
  );
};

export default CampaignAffectedArea;
