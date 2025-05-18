// --- Skills ---
export var DamageType;
(function (DamageType) {
    DamageType["Physical"] = "physical";
    DamageType["Desire"] = "desire";
})(DamageType || (DamageType = {}));
export var TargetType;
(function (TargetType) {
    TargetType["Enemy"] = "enemy";
    TargetType["Ally"] = "ally";
    TargetType["Self"] = "self";
    TargetType["Area"] = "area";
})(TargetType || (TargetType = {}));
