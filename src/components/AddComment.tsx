import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import {
  Alert,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { supabase } from "../lib/supabase";

type Comment = {
  id: string;
  user_id: string;
  post_id: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export default function AddComment({
  session,
  post_id,
}: {
  session: Session;
  post_id: string;
}) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  async function addComment() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        user_id: session?.user.id,
        post_id: post_id,
        description: comment,
      };

      const { error } = await supabase.from("comments").upsert(updates);

      if (error) {
        throw error;
      }

      setComment("");
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { error } = await supabase.from("comments").delete().match({ id });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .order("id", { ascending: true })
          .eq("post_id", post_id);
        if (error) {
          throw error;
        }
        if (data) {
          setComments(data);
        }
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          Alert.alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime:public:comments:post_id=eq." + post_id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: "post_id=eq." + post_id,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setComments((currentComments) =>
              currentComments.filter((comment) => comment.id !== payload.old.id)
            );
            return;
          }

          if (payload.eventType === "UPDATE") {
            setComments((currentComments) =>
              currentComments.map((comment) => {
                if (comment.id === payload.new.id) {
                  return payload.new as Comment;
                }
                return comment;
              })
            );
            return;
          }

          if (payload.eventType === "INSERT") {
            setComments((currentComments) => {
              return [payload.new as Comment, ...currentComments];
            });
            return;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <View>
      <TextInput
        placeholder="Comment"
        value={comment}
        onChangeText={(text) => setComment(text)}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={addComment}
        disabled={loading}
        style={styles.buttonAdd}
      >
        <Text style={styles.textAdd}>Add Comment</Text>
      </TouchableOpacity>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.comment}>
          <Text>{comment.description}</Text>
          <TouchableOpacity onPress={() => deleteComment(comment.id)}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  verticallySpaced: {
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    marginBottom: 20,
  },
  comment: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    marginTop: 20,
  },
  buttonAdd: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
  },
  textAdd: {
    color: "white",
  },
});
