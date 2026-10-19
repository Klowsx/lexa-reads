import { getOnboardingRoute } from "~/features/auth/onboarding-route";

describe("Reanudación del primer ingreso", () => {
  it.each([
    [1, "/(auth)/onboarding/genres"],
    [2, "/(auth)/onboarding/goal"],
    [3, "/(auth)/onboarding/username"],
  ])("retoma el paso %s guardado, también cuando se saltaron preferencias", (step, route) => {
    expect(getOnboardingRoute({ onboarding_completed: false, onboarding_step: step })).toBe(route);
  });

  it("lleva al feed si ya terminó, independientemente del paso guardado", () => {
    expect(getOnboardingRoute({ onboarding_completed: true, onboarding_step: 1 })).toBe("/(tabs)/feed");
  });
});
