import prisma from "./db";

export interface RefereeJoinRequest {
  id?: number;
  tournamentId: number;
  refereeId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message?: string | null;
  createdAt?: Date;
}

export class TournamentRefereeService {
  // Request to join a tournament as a referee
  static async requestToJoin(
    tournamentId: number,
    refereeId: number,
    message?: string
  ): Promise<RefereeJoinRequest> {
    return await prisma.refereeJoinRequest.create({
      data: {
        tournamentId,
        refereeId,
        status: "PENDING",
        message,
      },
    });
  }

  // Get requests for a specific tournament
  static async getRequestsByTournament(
    tournamentId: number
  ): Promise<RefereeJoinRequest[]> {
    return await prisma.refereeJoinRequest.findMany({
      where: { tournamentId },
      include: {
        referee: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get requests made by a specific referee
  static async getRequestsByReferee(
    refereeId: number
  ): Promise<RefereeJoinRequest[]> {
    return await prisma.refereeJoinRequest.findMany({
      where: { refereeId },
      include: {
        tournament: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Approve a join request
  static async approveRequest(requestId: number): Promise<RefereeJoinRequest> {
    return await prisma.refereeJoinRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });
  }

  // Reject a join request
  static async rejectRequest(requestId: number): Promise<RefereeJoinRequest> {
    return await prisma.refereeJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  }

  // Check if a referee is approved for a tournament
  static async isRefereeApproved(
    tournamentId: number,
    refereeId: number
  ): Promise<boolean> {
    const request = await prisma.refereeJoinRequest.findFirst({
      where: {
        tournamentId,
        refereeId,
        status: "APPROVED",
      },
    });

    return !!request;
  }
}
