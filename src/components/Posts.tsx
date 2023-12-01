import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, TextInput, Button, Text } from "react-native";
import { Session } from "@supabase/supabase-js";
import AddComment from "./AddComment";

type Post = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function Posts({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  async function addPost() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        user_id: session?.user.id,
        title: post,
      };

      const { error } = await supabase.from("posts").upsert(updates);

      if (error) {
        throw error;
      }

      setPost("");
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { error } = await supabase.from("posts").delete().match({ id });

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
    const channel = supabase
      .channel("realtime:public:posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setPosts((currentPosts) =>
              currentPosts.filter((post) => post.id !== payload.old.id)
            );
            return;
          }

          if (payload.eventType === "UPDATE") {
            setPosts((currentPosts) =>
              currentPosts.map((post) => {
                if (post.id === payload.new.id) {
                  return payload.new as Post;
                }
                return post;
              })
            );
            return;
          }

          if (payload.eventType === "INSERT") {
            setPosts((currentPosts) => [payload.new as Post, ...currentPosts]);
            return;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data) setPosts(data);
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          Alert.alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* Add new Posts */}
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          value={post || ""}
          onChangeText={(text) => setPost(text)}
          placeholder="post"
        />
        <Button title="Add new Post" onPress={addPost} disabled={loading} />
      </View>

      {/* List of Posts */}
      <View style={styles.verticallySpaced}>
        {posts.map((post) => (
          <View key={post.id} style={styles.post}>
            <View style={styles.postContent}>
              <Text>{post.title}</Text>
              <Button
                title="Delete"
                onPress={() => deletePost(post.id)}
                disabled={loading}
              />
            </View>

            <AddComment post_id={post.id} session={session} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
  },
  post: {
    marginTop: 20,
    padding: 10,
    borderColor: "gray",
    borderWidth: 1,
    gap: 10,
  },
  postContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
