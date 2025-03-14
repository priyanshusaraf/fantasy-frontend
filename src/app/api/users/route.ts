// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/user-service";
import { validateUserUpdate } from "@/utils/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          message: "Invalid pagination parameters",
          details: "Page must be > 0, limit must be between 1 and 100",
        },
        { status: 400 }
      );
    }

    const result = await UserService.listUsers(page, limit);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve users",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    // Validate user data
    const validationError = validateUserUpdate(userData);
    if (validationError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationError,
        },
        { status: 400 }
      );
    }

    const result = await UserService.createUser(userData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// src/app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to retrieve user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const updateData = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    // Validate update data
    const validationError = validateUserUpdate(updateData);
    if (validationError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationError,
        },
        { status: 400 }
      );
    }

    const updatedUser = await UserService.updateUser(userId, updateData);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to update user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const result = await UserService.deleteUser(userId);

    return NextResponse.json(
      {
        message: "User deleted successfully",
        success: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete user",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
