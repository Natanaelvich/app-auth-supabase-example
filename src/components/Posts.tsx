import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, TextInput, Button, Text } from "react-native";
import { Session } from "@supabase/supabase-js";

type Post = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function Posts({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
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

      const posts = await supabase.from("posts").select("*");
      setPosts(posts.data as Post[]);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

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
        <Button title="Add new Post" onPress={addPost} disabled={!loading} />
      </View>

      {/* List of Posts */}
      <View style={styles.verticallySpaced}>
        {posts.map((post) => (
          <View key={post.id}>
            <Text>{post.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
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
});
