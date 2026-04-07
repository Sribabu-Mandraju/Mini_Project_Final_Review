import { useState } from "react";
import { useAddDaoMember } from "../../hooks/useAddDaoMember";
import { useRemoveDaoMember } from "../../hooks/useRemoveDaoMember";
import {
  FiCopy,
  FiPlus,
  FiSettings,
  FiTrash2,
  FiUserMinus,
  FiUsers,
} from "react-icons/fi";

const MembersSection = ({
  members,
  newMemberAddress,
  onNewMemberAddressChange,
  onAddMember,
  onRemoveMember,
  onDeleteMember,
  escrowAddress,
  newEscrowAddress,
  onNewEscrowAddressChange,
  onSetEscrowAddress,
}) => {
  const [copiedAddress, setCopiedAddress] = useState("");

  const {
    addDaoMember,
    isPending,
    isConfirming,
    isVerifying,
    successMessage,
    error,
  } = useAddDaoMember();

  const {
    removeDaoMember,
    isPending: isRemoving,
    isConfirming: isConfirmingRemoval,
    isVerifying: isVerifyingRemoval,
  } = useRemoveDaoMember();

  const handleAddMember = async () => {
    if (!newMemberAddress) {
      return;
    }

    try {
      await addDaoMember(newMemberAddress);

      if (onAddMember) {
        onAddMember(newMemberAddress);
      }
    } catch {
      // Error is already handled and exposed by the hook via `error`.
    }
  };
  const activeMembers = members.filter((member) => member.status !== "Removed")
    .length;
  const removedMembers = members.filter((member) => member.status === "Removed")
    .length;

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(""), 1200);
    } catch {
      // Clipboard API fallback for older contexts.
      const tempInput = document.createElement("input");
      tempInput.value = address;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(""), 1200);
    }
  };

  const handleRemoveMember = async (address) => {
    try {
      await removeDaoMember(address);

      if (onRemoveMember) {
        onRemoveMember(address);
      }
    } catch {
      // Errors are handled via toast and hook state
    }
  };

  return (
    <section className="mt-10">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white sm:text-2xl">
          DAO Admin Controls
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Manage DAO members and configure the escrow contract address from one
          place.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              <FiUsers className="h-4 w-4 text-orange-300" />
              Member Controls
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newMemberAddress}
                onChange={(event) =>
                  onNewMemberAddressChange(event.target.value)
                }
                placeholder="Wallet address (e.g. 0x...)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-orange-400/70"
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={
                  !newMemberAddress || isPending || isConfirming || isVerifying
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiPlus className="h-4 w-4" />
                {isPending && "Preparing..."}
                {isConfirming && "Confirming..."}
                {isVerifying && "Verifying..."}
                {!isPending && !isConfirming && !isVerifying && "Add Member"}
              </button>
            </div>
            {(successMessage || error) && (
              <div className="mt-3 space-y-1 text-xs">
                {successMessage && (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                    {successMessage}
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
                    {error}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <p className="text-xs text-slate-400">Active Members</p>
                <p className="text-lg font-bold text-white">{activeMembers}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <p className="text-xs text-slate-400">Removed Members</p>
                <p className="text-lg font-bold text-white">{removedMembers}</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              <FiSettings className="h-4 w-4 text-orange-300" />
              Escrow Contract
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Set or update the escrow contract address used by the DAO.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newEscrowAddress}
                onChange={(event) =>
                  onNewEscrowAddressChange(event.target.value)
                }
                placeholder="Enter escrow contract address (0x...)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-orange-400/70"
              />
              <button
                type="button"
                onClick={onSetEscrowAddress}
                className="inline-flex items-center text-nowrap justify-center rounded-lg border border-orange-400/60 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-200 transition hover:border-orange-400 hover:text-white"
              >
                Set Escrow
              </button>
            </div>
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
              <p className="text-xs text-slate-400">Current Escrow Address</p>
              <p className="mt-1 break-all text-sm font-medium text-slate-200">
                {escrowAddress || "Not set"}
              </p>
            </div>
          </article>
        </div>

        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Member Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No DAO members yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.address}
                    className="border-b border-slate-800/70"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{member.address}</span>
                        <button
                          type="button"
                          onClick={() => copyAddress(member.address)}
                          className="rounded-md border border-slate-700 p-1.5 text-slate-300 transition hover:border-orange-400/60 hover:text-orange-300"
                          aria-label="Copy wallet address"
                          title={
                            copiedAddress === member.address ? "Copied" : "Copy"
                          }
                        >
                          <FiCopy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {member.role}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {member.joinedAt}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          member.status === "Removed"
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {member.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.address)}
                          disabled={
                            member.status === "Removed" ||
                            isRemoving ||
                            isConfirmingRemoval ||
                            isVerifyingRemoval
                          }
                          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400/70 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiUserMinus className="h-3.5 w-3.5" />
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMember(member.address)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/70 hover:bg-red-500/20"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {members.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-500">
              No DAO members yet.
            </div>
          ) : (
            members.map((member) => (
              <article
                key={member.address}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200">
                    {member.address}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyAddress(member.address)}
                    className="rounded-md border border-slate-700 p-1.5 text-slate-300 transition hover:border-orange-400/60 hover:text-orange-300"
                    aria-label="Copy wallet address"
                    title={copiedAddress === member.address ? "Copied" : "Copy"}
                  >
                    <FiCopy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Role: {member.role}
                </p>
                <p className="text-xs text-slate-500">
                  Joined: {member.joinedAt}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Status: {member.status || "Active"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.address)}
                    disabled={
                      member.status === "Removed" ||
                      isRemoving ||
                      isConfirmingRemoval ||
                      isVerifyingRemoval
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400/70 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiUserMinus className="h-3.5 w-3.5" />
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMember(member.address)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/70 hover:bg-red-500/20"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default MembersSection;
