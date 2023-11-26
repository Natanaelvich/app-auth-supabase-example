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

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

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
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TextInput
          style={styles.input}
          value={session?.user?.email}
          editable={false}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          value={username || ""}
          onChangeText={(text) => setUsername(text)}
          placeholder="username"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          value={website || ""}
          onChangeText={(text) => setWebsite(text)}
          placeholder="website"
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? "Loading ..." : "Update"}
          onPress={() =>
            updateProfile({ username, website, avatar_url: avatarUrl })
          }
          disabled={loading}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>

      {/* Add new Posts */}
      <View style={styles.verticallySpaced}>
        <TextInput
          style={styles.input}
          value={post || ""}
          onChangeText={(text) => setPost(text)}
          placeholder="post"
        />
        <Button title="Add new Post" onPress={addPost} />
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
