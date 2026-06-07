import { View, StyleSheet } from "react-native";

export function GoogleIcon() {
  return (
    <View style={googleStyles.svg}>
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: "#4285F4", top: 0, left: "50%" },
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: "#34A853", bottom: 0, left: "50%" },
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: "#FBBC04", bottom: 0, left: 0 },
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: "#EA4335", top: 0, left: 0 },
        ]}
      />
      <View
        className="bg-surface absolute rounded-[3.5px]"
        style={googleStyles.hole}
      />
    </View>
  );
}

const googleStyles = StyleSheet.create({
  svg: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    position: "relative",
  },
  quarter: {
    position: "absolute",
    width: "50%",
    height: "50%",
  },
  hole: {
    width: 7,
    height: 7,
    top: 3.5,
    left: 3.5,
  },
});
