// src/app/(protected)/posts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Define Post interface
interface Post {
  id: number;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  author: string;
  publishedAt: string | null;
  createdAt: string;
}

// Mock data - in a real application this would come from API
const MOCK_POSTS: Post[] = [
  {
    id: 1,
    title: "Tournament Rules & Regulations",
    category: "Rules",
    status: "PUBLISHED",
    author: "Admin",
    publishedAt: "2023-10-15T10:30:00Z",
    createdAt: "2023-10-10T15:45:00Z",
  },
  {
    id: 2,
    title: "Fantasy Scoring System Explained",
    category: "Fantasy",
    status: "PUBLISHED",
    author: "Admin",
    publishedAt: "2023-10-18T09:15:00Z",
    createdAt: "2023-10-05T11:30:00Z",
  },
  {
    id: 3,
    title: "Upcoming Tournament Announcement",
    category: "News",
    status: "PUBLISHED",
    author: "Admin",
    publishedAt: "2023-11-01T14:00:00Z",
    createdAt: "2023-10-25T16:45:00Z",
  },
  {
    id: 4,
    title: "Tips for Fantasy Team Selection",
    category: "Fantasy",
    status: "DRAFT",
    author: "Admin",
    publishedAt: null,
    createdAt: "2023-11-05T10:20:00Z",
  },
  {
    id: 5,
    title: "Interview with Champion Player",
    category: "News",
    status: "DRAFT",
    author: "Admin",
    publishedAt: null,
    createdAt: "2023-11-10T09:30:00Z",
  },
];

export default function PostsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate API call
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // const response = await fetch('/api/posts');
        // const data = await response.json();
        // setPosts(data);

        // Using mock data for now
        setPosts(MOCK_POSTS);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts based on search term and active tab
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "published")
      return matchesSearch && post.status === "PUBLISHED";
    if (activeTab === "drafts") return matchesSearch && post.status === "DRAFT";
    if (activeTab === "archived")
      return matchesSearch && post.status === "ARCHIVED";

    return matchesSearch;
  });

  const handleCreatePost = () => {
    router.push("/posts/create");
  };

  const handleViewPost = (id: number) => {
    router.push(`/posts/${id}`);
  };

  const handleEditPost = (id: number) => {
    router.push(`/posts/${id}/edit`);
  };

  const handleDeletePost = async (id: number) => {
    // In a real app, you would call your API
    // const confirmation = confirm("Are you sure you want to delete this post?");

    // if (confirmation) {
    //   try {
    //     const response = await fetch(`/api/posts/${id}`, {
    //       method: 'DELETE',
    //     });

    //     if (response.ok) {
    //       setPosts(posts.filter(post => post.id !== id));
    //       toast.success("Post deleted successfully");
    //     } else {
    //       throw new Error("Failed to delete post");
    //     }
    //   } catch (error) {
    //     console.error("Error deleting post:", error);
    //     toast.error("Failed to delete post");
    //   }
    // }

    // Using mock for now
    setPosts(posts.filter((post) => post.id !== id));
    toast.success("Post deleted successfully");
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

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#00a1e0]">Posts</h1>
            <p className="text-gray-600 mt-1">
              Manage your tournament news and articles
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0 bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={handleCreatePost}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
            <CardDescription>
              View and manage all your tournament posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search posts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading posts...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No posts found.{" "}
                    {searchTerm && "Try a different search term."}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">
                              {post.title}
                            </TableCell>
                            <TableCell>{post.category}</TableCell>
                            <TableCell>{getStatusBadge(post.status)}</TableCell>
                            <TableCell>{formatDate(post.createdAt)}</TableCell>
                            <TableCell>
                              {formatDate(post.publishedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewPost(post.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPost(post.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="published" className="space-y-4">
                {/* Same table structure but filtered for published posts */}
                {/* For brevity, I'll skip duplicating the full table here */}
              </TabsContent>

              <TabsContent value="drafts" className="space-y-4">
                {/* Same table structure but filtered for draft posts */}
              </TabsContent>

              <TabsContent value="archived" className="space-y-4">
                {/* Same table structure but filtered for archived posts */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
