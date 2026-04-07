import { useCallback, useEffect, useState } from "react";
import DaoHeader from "../../components/dao/DaoHeader";
import DaoStatsCards from "../../components/dao/DaoStatsCards";
import MembersSection from "../../components/dao/MembersSection";
import ProposalsSection from "../../components/dao/ProposalsSection";
import { BACKEND_API_URL } from "../../shared/contractConfig";

const Dao = () => {
  const [statusFilter, setStatusFilter] = useState("All States");
  const [activeTab, setActiveTab] = useState("proposals");
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [newEscrowAddress, setNewEscrowAddress] = useState("");
  const [escrowAddress, setEscrowAddress] = useState("0x9b...E4A1");
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      setMembersError(null);

      const response = await fetch(
        `${BACKEND_API_URL}/dao-members?isDaoMember=true`,
      );
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to load DAO members");
      }

      const apiMembers = json.data?.members ?? [];

      setMembers(
        apiMembers.map((member) => ({
          address: member.daoMemberAddress,
          role: "Voter",
          joinedAt: member.addedAt
            ? new Date(member.addedAt).toISOString().slice(0, 10)
            : "",
          status: member.isDaoMember ? "Active" : "Removed",
        })),
      );
    } catch (error) {
      setMembersError(error.message || "Failed to load DAO members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addDaoMember = () => {
    const value = newMemberAddress.trim();
    if (!value) return;

    // After on-chain + backend verification (handled in MembersSection hook),
    // refresh members from backend so UI reflects the latest state.
    loadMembers();
    setNewMemberAddress("");
  };

  const removeDaoMember = (_address) => {
    // After on-chain + backend verification (handled in MembersSection hook),
    // refresh members from backend so UI reflects isDaoMember=false.
    loadMembers();
  };

  const deleteDaoMember = (address) => {
    setMembers((prev) => prev.filter((member) => member.address !== address));
  };

  const updateEscrowAddress = () => {
    const value = newEscrowAddress.trim();
    if (!value) return;
    setEscrowAddress(value);
    setNewEscrowAddress("");
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <DaoHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        membersCount={members.length}
      />

      {activeTab === "proposals" ? (
        <>
          <DaoStatsCards />
          <ProposalsSection
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </>
      ) : (
        <MembersSection
          members={members}
          newMemberAddress={newMemberAddress}
          onNewMemberAddressChange={setNewMemberAddress}
          onAddMember={addDaoMember}
          onRemoveMember={removeDaoMember}
          onDeleteMember={deleteDaoMember}
          escrowAddress={escrowAddress}
          newEscrowAddress={newEscrowAddress}
          onNewEscrowAddressChange={setNewEscrowAddress}
          onSetEscrowAddress={updateEscrowAddress}
        />
      )}
    </main>
  );
};

export default Dao;
