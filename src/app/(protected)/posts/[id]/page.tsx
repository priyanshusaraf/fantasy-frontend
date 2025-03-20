// src/app/(protected)/posts/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Edit, Calendar, User, Tag } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  author: string;
  publishedAt: string | null;
  createdAt: string;
}

// Sample post data - in a real app, you would fetch this from API
const SAMPLE_POST: Post = {
  id: 1,
  title: "Tournament Rules & Regulations",
  content: `
# Tournament Rules & Regulations

## General Rules

1. All players must check in 30 minutes before their scheduled match time.
2. Players must wear appropriate athletic attire and non-marking court shoes.
3. The tournament director's decisions are final.

## Match Format

- All matches will be best of 3 games to 11 points.
- Players must win by 2 points.
- The third game, if necessary, will be played to 11 points.

## Scoring

- Rally scoring will be used (point scored on every rally).
- The server continues to serve as long as they win points.
- Server must announce the score before each serve.

## Equipment

- Players must bring their own paddles.
- Only approved paddles from the official equipment list are allowed.
- Tournament balls will be provided.

## Conduct

- Unsportsmanlike conduct will not be tolerated.
- Verbal abuse of opponents, officials, or spectators may result in forfeiture of the match.
- Players are expected to call their own lines honestly.

## Prizes

- Prizes will be awarded to winners and runners-up in each division.
- Additional prizes may be awarded at the discretion of the tournament committee.

We look forward to a fun and competitive tournament. Good luck to all participants!
  `,
  category: "Rules",
  status: "PUBLISHED",
  author: "Admin",
  publishedAt: "2023-10-15T10:30:00Z",
  createdAt: "2023-10-10T15:45:00Z",
};

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch from API
        // const response = await fetch(`/api/posts/${params.id}`);
        // const data = await response.json();
        // setPost(data);

        // Using sample data for now
        setPost(SAMPLE_POST);
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/posts/${params.id}/edit`);
  };

  const getStatusBadge = (status: Post["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "DRAFT":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Loading post...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!post) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-500">Post not found</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#00a1e0]">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Published: {formatDate(post.publishedAt)}
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Author: {post.author}
                </div>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Category: {post.category}
                </div>
                {getStatusBadge(post.status)}
              </div>
            </div>
            <Button
              className="bg-[#00a1e0] hover:bg-[#0072a3]"
              onClick={handleEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Post
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              {/* In a real app, you would render markdown content here */}
              <div
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 text-sm text-gray-500">
            Last updated: {formatDate(post.createdAt)}
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}
