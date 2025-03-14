import { connectToDatabase } from "@/lib/db";
import {
  Tournament,
  CreateTournamentInput,
  UpdateTournamentInput,
} from "@/lib/db/schema";
import { logEvent } from "@/middleware/error-handler";

export class TournamentService {
  static async createTournament(
    tournamentData: CreateTournamentInput
  ): Promise<Tournament> {
    const connection = await connectToDatabase();

    try {
      const [result] = await connection.execute(
        `INSERT INTO tournaments 
        (name, description, type, status, startDate, endDate, 
        registrationOpenDate, registrationCloseDate, location, 
        maxParticipants, entryFee, prizeMoney, organizerId, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tournamentData.name,
          tournamentData.description,
          tournamentData.type,
          tournamentData.status,
          tournamentData.startDate,
          tournamentData.endDate,
          tournamentData.registrationOpenDate,
          tournamentData.registrationCloseDate,
          tournamentData.location,
          tournamentData.maxParticipants,
          tournamentData.entryFee,
          tournamentData.prizeMoney,
          tournamentData.organizerId,
          new Date(),
          new Date(),
        ]
      );

      logEvent("Tournament Created", {
        tournamentName: tournamentData.name,
        organizerId: tournamentData.organizerId,
      });

      return {
        ...tournamentData,
        id: result.insertId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Tournament;
    } catch (error) {
      logEvent("Tournament Creation Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tournamentName: tournamentData.name,
      });
      throw error;
    } finally {
      await connection.end();
    }
  }

  static async getTournamentById(id: number): Promise<Tournament | null> {
    const connection = await connectToDatabase();

    try {
      const [tournaments] = await connection.execute(
        "SELECT * FROM tournaments WHERE id = ?",
        [id]
      );

      return (tournaments[0] as Tournament) || null;
    } catch (error) {
      logEvent("Get Tournament Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tournamentId: id,
      });
      throw error;
    } finally {
      await connection.end();
    }
  }

  static async updateTournament(
    id: number,
    updateData: UpdateTournamentInput
  ): Promise<Tournament | null> {
    const connection = await connectToDatabase();

    try {
      // Prepare update fields dynamically
      const updateFields = Object.keys(updateData)
        .filter((key) => updateData[key] !== undefined)
        .map((key) => `${key} = ?`)
        .join(", ");

      const values = Object.keys(updateData)
        .filter((key) => updateData[key] !== undefined)
        .map((key) => updateData[key]);

      values.push(id);

      // Add updatedAt timestamp
      const query = `
        UPDATE tournaments 
        SET ${updateFields}, updatedAt = ? 
        WHERE id = ?
      `;

      await connection.execute(query, [...values, new Date(), id]);

      logEvent("Tournament Updated", {
        tournamentId: id,
        updates: Object.keys(updateData),
      });

      return this.getTournamentById(id);
    } catch (error) {
      logEvent("Tournament Update Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tournamentId: id,
      });
      throw error;
    } finally {
      await connection.end();
    }
  }

  static async listTournaments(
    page = 1,
    limit = 10,
    filters: Partial<Tournament> = {}
  ): Promise<{
    tournaments: Tournament[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const connection = await connectToDatabase();

    try {
      const offset = (page - 1) * limit;

      // Prepare filter conditions
      const filterConditions = Object.keys(filters)
        .filter((key) => filters[key] !== undefined)
        .map((key) => `${key} = ?`)
        .join(" AND ");

      const filterValues = Object.keys(filters)
        .filter((key) => filters[key] !== undefined)
        .map((key) => filters[key]);

      // Construct query with dynamic filters
      const baseQuery = `
        SELECT * FROM tournaments 
        ${filterConditions ? `WHERE ${filterConditions}` : ""} 
        LIMIT ? OFFSET ?
      `;

      const [tournaments] = await connection.execute(baseQuery, [
        ...filterValues,
        limit,
        offset,
      ]);

      // Get total count with same filters
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM tournaments 
        ${filterConditions ? `WHERE ${filterConditions}` : ""}`,
        filterValues
      );

      const total = countResult[0]["total"];

      return {
        tournaments: tournaments as Tournament[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logEvent("List Tournaments Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        page,
        limit,
      });
      throw error;
    } finally {
      await connection.end();
    }
  }

  static async deleteTournament(id: number): Promise<boolean> {
    const connection = await connectToDatabase();

    try {
      await connection.execute("DELETE FROM tournaments WHERE id = ?", [id]);

      logEvent("Tournament Deleted", { tournamentId: id });

      return true;
    } catch (error) {
      logEvent("Tournament Deletion Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tournamentId: id,
      });
      throw error;
    } finally {
      await connection.end();
    }
  }
}
