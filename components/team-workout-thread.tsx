import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { InfoCard, PrimaryButton, SecondaryButton } from "@/components/ui-kit";
import { useProfile } from "@/contexts/profile-context";
import { useThemeColors } from "@/contexts/theme-context";
import { supabase } from "@/lib/supabase";

type TeamWorkout = {
  id: string;
  team_id: string;
  created_by: string;
  title: string;
  description: string;
  workout_date: string;
  created_at: string;
};

type TeamWorkoutComment = {
  id: string;
  team_workout_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

type ProfileLookupRow = {
  user_id?: string | null;
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

export function TeamWorkoutThread({
  teamId,
  emptyMessage,
  refreshKey = 0,
}: {
  teamId: string;
  emptyMessage: string;
  refreshKey?: number;
}) {
  const { colors } = useThemeColors();
  const { displayName } = useProfile();
  const [workouts, setWorkouts] = useState<TeamWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<TeamWorkout | null>(null);
  const [comments, setComments] = useState<TeamWorkoutComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [profileLabels, setProfileLabels] = useState<Record<string, string>>({});

  const loadWorkouts = useCallback(async () => {
    if (!teamId) {
      setWorkouts([]);
      return;
    }

    setLoadingWorkouts(true);
    setFeedError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || "");

      const { data, error } = await supabase
        .from("team_workouts")
        .select("*")
        .eq("team_id", teamId)
        .order("workout_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setFeedError(`Unable to load team workouts: ${error.message}`);
        return;
      }

      setWorkouts((data as TeamWorkout[] | null) ?? []);
    } finally {
      setLoadingWorkouts(false);
    }
  }, [teamId]);

  const loadComments = useCallback(async (workout: TeamWorkout) => {
    setLoadingComments(true);
    setCommentError("");

    try {
      const { data, error } = await supabase
        .from("team_workout_comments")
        .select("*")
        .eq("team_workout_id", workout.id)
        .order("created_at", { ascending: true });

      if (error) {
        setCommentError(`Unable to load comments: ${error.message}`);
        setComments([]);
        return;
      }

      const nextComments = (data as TeamWorkoutComment[] | null) ?? [];
      setComments(nextComments);

      const uniqueUserIds = Array.from(new Set(nextComments.map((comment) => comment.user_id).filter(Boolean)));

      if (uniqueUserIds.length === 0) {
        setProfileLabels({});
        return;
      }

      const profileQuery = await supabase
        .from("profiles")
        .select("user_id,id,name,email")
        .or(uniqueUserIds.map((userId) => `user_id.eq.${userId},id.eq.${userId}`).join(","));

      if (profileQuery.error || !profileQuery.data) {
        setProfileLabels({});
        return;
      }

      const nextLabels = (profileQuery.data as ProfileLookupRow[]).reduce<Record<string, string>>((result, row) => {
        const key = row.user_id || row.id;

        if (!key) {
          return result;
        }

        result[key] = row.name?.trim() || row.email?.trim() || "";
        return result;
      }, {});

      setProfileLabels(nextLabels);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts, refreshKey]);

  useEffect(() => {
    if (!selectedWorkout) {
      setComments([]);
      setProfileLabels({});
      setCommentDraft("");
      setCommentError("");
      return;
    }

    void loadComments(selectedWorkout);
  }, [loadComments, selectedWorkout]);

  const handlePostComment = async () => {
    if (!selectedWorkout || postingComment) {
      return;
    }

    const trimmedComment = commentDraft.trim();

    if (!trimmedComment) {
      setCommentError("Enter a comment before posting.");
      return;
    }

    setPostingComment(true);
    setCommentError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCommentError("Sign in again before posting comments.");
        return;
      }

      const { error } = await supabase.from("team_workout_comments").insert({
        team_workout_id: selectedWorkout.id,
        user_id: user.id,
        comment: trimmedComment,
      });

      if (error) {
        setCommentError(`Unable to post comment: ${error.message}`);
        return;
      }

      setCommentDraft("");
      await loadComments(selectedWorkout);
    } finally {
      setPostingComment(false);
    }
  };

  const selectedWorkoutComments = useMemo(() => comments, [comments]);

  return (
    <>
      <InfoCard
        title={loadingWorkouts ? "Loading workouts..." : "Team Workouts"}
        subtitle="Tap any workout to view the details and comment thread for your team."
      >
        <View style={{ gap: 12 }}>
          {!!feedError ? (
            <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{feedError}</Text>
          ) : null}

          {workouts.length > 0 ? (
            workouts.map((workout) => (
              <Pressable
                key={workout.id}
                onPress={() => setSelectedWorkout(workout)}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{workout.title}</Text>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 6 }}>
                  {formatDate(workout.workout_date)}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21, marginTop: 8 }} numberOfLines={3}>
                  {workout.description || "No description added."}
                </Text>
              </Pressable>
            ))
          ) : !loadingWorkouts ? (
            <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>{emptyMessage}</Text>
          ) : null}
        </View>
      </InfoCard>

      <Modal visible={Boolean(selectedWorkout)} transparent animationType="fade" onRequestClose={() => setSelectedWorkout(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3, 8, 18, 0.72)", justifyContent: "center", padding: 20 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 22,
              maxHeight: "88%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 18 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
                TEAM WORKOUT
              </Text>

              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 }}>
                  {selectedWorkout?.title || "Workout"}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
                  {selectedWorkout ? formatDate(selectedWorkout.workout_date) : ""}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 18,
                }}
              >
                <Text style={{ color: colors.subtext, fontSize: 15, lineHeight: 23 }}>
                  {selectedWorkout?.description || "No workout description added."}
                </Text>
              </View>

              <InfoCard
                title={loadingComments ? "Loading comments..." : "Comments"}
                subtitle="This comment thread is shared by members of the same team."
              >
                <View style={{ gap: 12 }}>
                  {selectedWorkoutComments.length > 0 ? (
                    selectedWorkoutComments.map((comment) => (
                      <View
                        key={comment.id}
                        style={{
                          alignSelf: comment.user_id === currentUserId ? "flex-end" : "flex-start",
                          maxWidth: "92%",
                          backgroundColor: comment.user_id === currentUserId ? colors.primarySoft : colors.cardAlt,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: comment.user_id === currentUserId ? colors.primary : colors.border,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>
                          {resolveCommentAuthor({
                            commentUserId: comment.user_id,
                            currentUserId,
                            createdBy: selectedWorkout?.created_by || "",
                            displayName,
                            profileLabels,
                          })}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{comment.comment}</Text>
                        <Text style={{ color: colors.subtext, fontSize: 11, marginTop: 8 }}>{formatTimestamp(comment.created_at)}</Text>
                      </View>
                    ))
                  ) : !loadingComments ? (
                    <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 21 }}>
                      No comments yet. Start the thread for this workout.
                    </Text>
                  ) : null}

                  {!!commentError ? (
                    <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "700" }}>{commentError}</Text>
                  ) : null}

                  <TextInput
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder="Add a comment"
                    placeholderTextColor={colors.subtext}
                    multiline
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 16,
                      paddingVertical: 15,
                      minHeight: 84,
                      textAlignVertical: "top",
                      fontSize: 15,
                    }}
                  />

                  <PrimaryButton label={postingComment ? "Posting Comment..." : "Post Comment"} onPress={() => void handlePostComment()} />
                </View>
              </InfoCard>

              <SecondaryButton label="Close" onPress={() => setSelectedWorkout(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function resolveCommentAuthor({
  commentUserId,
  currentUserId,
  createdBy,
  displayName,
  profileLabels,
}: {
  commentUserId: string;
  currentUserId: string;
  createdBy: string;
  displayName: string;
  profileLabels: Record<string, string>;
}) {
  if (commentUserId === currentUserId) {
    return displayName || "You";
  }

  if (profileLabels[commentUserId]) {
    return profileLabels[commentUserId];
  }

  if (commentUserId === createdBy) {
    return "Coach";
  }

  return `Runner ${commentUserId.slice(0, 6)}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
