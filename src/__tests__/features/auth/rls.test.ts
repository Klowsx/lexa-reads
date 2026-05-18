import { adminClient, createTestUser } from "~/test-utils/supabase";

const SKIP = !process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("RLS: users table", () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    if (SKIP) return;
    userA = await createTestUser("rls-user-a@test.lexa", "password123");
    userB = await createTestUser("rls-user-b@test.lexa", "password123");
  });

  afterAll(async () => {
    if (SKIP) return;
    await userA.cleanup();
    await userB.cleanup();
  });

  (SKIP ? it.skip : it)("usuario puede leer su propio perfil", async () => {
    const { data, error } = await userA.client
      .from("users")
      .select("id, username")
      .eq("id", userA.user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userA.user.id);
  });

  (SKIP ? it.skip : it)("usuario puede leer perfil público ajeno", async () => {
    const { data, error } = await userA.client
      .from("users")
      .select("id")
      .eq("id", userB.user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userB.user.id);
  });

  (SKIP ? it.skip : it)("usuario NO puede actualizar perfil ajeno", async () => {
    await userA.client
      .from("users")
      .update({ bio: "hacked" })
      .eq("id", userB.user.id);

    const { data } = await adminClient
      .from("users")
      .select("bio")
      .eq("id", userB.user.id)
      .single();

    expect(data?.bio).not.toBe("hacked");
  });

  (SKIP ? it.skip : it)("bloqueador NO ve el perfil del usuario bloqueado", async () => {
    const { error: blockError } = await adminClient.from("user_blocks").insert({
      blocker_id: userA.user.id,
      blocked_id: userB.user.id,
    });
    expect(blockError).toBeNull();

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id&id=eq.${userA.user.id}`,
      {
        headers: {
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${userB.accessToken}`,
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();

    expect(data).toHaveLength(0);

    await adminClient
      .from("user_blocks")
      .delete()
      .match({ blocker_id: userA.user.id, blocked_id: userB.user.id });
  });
});
