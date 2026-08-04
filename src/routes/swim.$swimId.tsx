import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  addComment,
  commentsQueryKey,
  deleteComment,
  fetchComments,
} from "@/lib/comments";
import { fetchSwim, swimQueryKey } from "@/lib/swims";

export const Route = createFileRoute("/swim/$swimId")({
  head: () => ({
    meta: [
      { title: "A wild swim · Frozen Assets" },
      {
        name: "description",
        content:
          "Read the review of this wild swim, see the photo and leave your own notes on the cold water.",
      },
      { property: "og:title", content: "A wild swim · Frozen Assets" },
      {
        property: "og:description",
        content: "See this wild swim and leave your own notes on the water.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SwimDetail;
});
