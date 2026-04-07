import { MapContainer, TileLayer } from "react-leaflet";
import { FiMapPin } from "react-icons/fi";

import MapLocationController from "../../components/newProposal/MapLocationController";
import { defaultZoom } from "../../components/newProposal/constants";

const ProposalAffectedArea = ({ proposal, center }) => {
  if (!proposal) return null;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <FiMapPin className="h-5 w-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-white">Affected Area</h2>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        This proposal covers a {proposal.campaign?.radius || "N/A"} km radius
        around the following location:
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
        <MapContainer
          center={center}
          zoom={
            proposal.campaign &&
            Number.isFinite(proposal.campaign.latitude) &&
            Number.isFinite(proposal.campaign.longitude)
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
              proposal.campaign &&
              Number.isFinite(proposal.campaign.latitude) &&
              Number.isFinite(proposal.campaign.longitude)
                ? {
                    latitude: proposal.campaign.latitude,
                    longitude: proposal.campaign.longitude,
                  }
                : null
            }
            radius={Number(proposal.campaign?.radius) || 0}
            disasterName={proposal.campaignTitle}
            onLocationSelect={null}
          />
        </MapContainer>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        {proposal.campaign?.latitude && proposal.campaign?.longitude && (
          <div>
            <span className="font-semibold">Coordinates:</span>{" "}
            {proposal.campaign.latitude.toFixed(4)},{" "}
            {proposal.campaign.longitude.toFixed(4)}
          </div>
        )}
        {proposal.campaign?.radius && (
          <div>
            <span className="font-semibold">Coverage Radius:</span>{" "}
            {proposal.campaign.radius} km
          </div>
        )}
      </div>
    </article>
  );
};

export default ProposalAffectedArea;
