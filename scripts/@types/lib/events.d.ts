import { Player, BlockExplodeAfterEvent, ButtonPushAfterEvent, ChatSendAfterEvent, ChatSendBeforeEvent, DataDrivenEntityTriggerAfterEvent, DataDrivenEntityTriggerBeforeEvent, EffectAddAfterEvent, EntityDieAfterEvent, EntityHealthChangedAfterEvent, EntityHitBlockAfterEvent, EntityHitEntityAfterEvent, EntityHurtAfterEvent, EntityLoadAfterEvent, EntityRemoveAfterEvent, EntityRemoveBeforeEvent, EntitySpawnAfterEvent, ExplosionAfterEvent, ExplosionBeforeEvent, ItemCompleteUseAfterEvent, ItemDefinitionAfterEventSignal, ItemDefinitionBeforeEventSignal, ItemReleaseUseAfterEvent, ItemStartUseAfterEvent, ItemStartUseOnAfterEvent, ItemStopUseAfterEvent, ItemStopUseOnAfterEvent, ItemUseAfterEvent, ItemUseBeforeEvent, ItemUseOnAfterEvent, ItemUseOnBeforeEvent, LeverActionAfterEvent, MessageReceiveAfterEvent, PistonActivateAfterEvent, PistonActivateBeforeEvent, PlayerBreakBlockAfterEvent, PlayerBreakBlockBeforeEvent, PlayerDimensionChangeAfterEvent, PlayerInteractWithBlockAfterEvent, PlayerInteractWithBlockBeforeEvent, PlayerInteractWithEntityAfterEvent, PlayerInteractWithEntityBeforeEvent, PlayerJoinAfterEvent, PlayerLeaveAfterEvent, PlayerPlaceBlockAfterEvent, PlayerPlaceBlockBeforeEvent, PlayerSpawnAfterEvent, PressurePlatePopAfterEvent, PressurePlatePushAfterEvent, ProjectileHitBlockAfterEvent, ProjectileHitEntityAfterEvent, TargetBlockHitAfterEvent, TripWireTripAfterEvent, WeatherChangeAfterEvent, WorldInitializeAfterEvent, PlayerLeaveBeforeEvent, ScriptEventCommandMessageAfterEvent, WatchdogTerminateBeforeEvent } from "@minecraft/server";

/**
 * @beta
 * @author yuki2825624
 */
export declare class EventEmitter {
    private constructor ();
    readonly on <T extends keyof WorldEventTypes> (eventName: T, listener: (eventData: WorldEventTypes[T]) => void): (eventData: WorldEventTypes[T]) => void;
    readonly off (listener: (eventData: WorldEventTypes[T]) => void): void;
    readonly emit <T extends keyof WorldEventTypes> (eventName: T, eventData: WorldEventTypes[T]): void;
}

/**
 * @beta
 * @author yuki2825624
 */
type WorldEventTypes = {
    
    // a
    
    // b
    "afterBlockExplode": BlockExplodeAfterEvent;
    "afterButtonPush": ButtonPushAfterEvent;

    // c
    "afterChatSend": ChatSendAfterEvent;
    "beforeChatSend": ChatSendBeforeEvent;

    // d
    "afterDataDrivenEntityTriggerEvent": DataDrivenEntityTriggerAfterEvent;
    "beforeDataDrivenEntityTriggerEvent": DataDrivenEntityTriggerBeforeEvent;

    // e
    "afterEffectAdd": EffectAddAfterEvent;
    "afterEntityDie": EntityDieAfterEvent;
    "afterEntityHealthChanged": EntityHealthChangedAfterEvent;
    "afterEntityHitBlock": EntityHitBlockAfterEvent;
    "afterEntityHitEntity": EntityHitEntityAfterEvent;
    "afterEntityHurt": EntityHurtAfterEvent;
    "afterEntityLoad": EntityLoadAfterEvent;
    "error": ErrorAfterEvent;
    "afterEntityRemove": EntityRemoveAfterEvent;
    "beforeEntityRemove": EntityRemoveBeforeEvent;
    "afterEntitySpawn": EntitySpawnAfterEvent;
    "afterExplosion": ExplosionAfterEvent;
    "beforeExplosion": ExplosionBeforeEvent;

    // f
    
    // g

    // h

    // i
    "afterItemCompleteUse": ItemCompleteUseAfterEvent;
    "afterItemDefinitionEvent": ItemDefinitionAfterEventSignal;
    "beforeItemDefinitionEvent": ItemDefinitionBeforeEventSignal;
    "afterItemReleaseUse": ItemReleaseUseAfterEvent;
    "afterItemStartUse": ItemStartUseAfterEvent;
    "afterItemStartUseOn": ItemStartUseOnAfterEvent;
    "afterItemStopUse": ItemStopUseAfterEvent;
    "afterItemStopUseOn": ItemStopUseOnAfterEvent;
    "afterItemUse": ItemUseAfterEvent;
    "beforeItemUse": ItemUseBeforeEvent;
    "afterItemUseOn": ItemUseOnAfterEvent;
    "beforeItemUseOn": ItemUseOnBeforeEvent;

    // j

    // k

    // l
    "afterLeverAction": LeverActionAfterEvent;

    // m
    "afterMessageReceive": MessageReceiveAfterEvent;

    // n

    // o
    
    // p
    "afterPistonActivate": PistonActivateAfterEvent;
    "beforePistonActivate": PistonActivateBeforeEvent;
    "afterPlayerAttack": PlayerAttackAfterEvent;
    "afterPlayerBreakBlock": PlayerBreakBlockAfterEvent;
    "beforePlayerBreakBlock": PlayerBreakBlockBeforeEvent;
    "afterPlayerDimensionChange": PlayerDimensionChangeAfterEvent;
    "afterPlayerInteractWithBlock": PlayerInteractWithBlockAfterEvent;
    "beforePlayerInteractWithBlock": PlayerInteractWithBlockBeforeEvent;
    "afterPlayerInteractWithEntity": PlayerInteractWithEntityAfterEvent;
    "beforePlayerInteractWithEntity": PlayerInteractWithEntityBeforeEvent;
    "afterPlayerJoin": PlayerJoinAfterEvent;
    "afterPlayerLeave": PlayerLeaveAfterEvent;
    "beforePlayerLeave": PlayerLeaveBeforeEvent;
    "afterPlayerPlaceBlock": PlayerPlaceBlockAfterEvent;
    "beforePlayerPlaceBlock": PlayerPlaceBlockBeforeEvent;
    "afterPlayerSpawn": PlayerSpawnAfterEvent;
    "afterPressurePlatePop": PressurePlatePopAfterEvent;
    "afterPressurePlatePush": PressurePlatePushAfterEvent;
    "afterProjectileHitBlock": ProjectileHitBlockAfterEvent;
    "afterProjectileHitEntity": ProjectileHitEntityAfterEvent;

    // q

    // r
    "ready": ReadyAfterEvent;

    // s
    "afterScriptEventReceive": ScriptEventCommandMessageAfterEvent;
    "afterSendCustomCommand": SendCustomCommandAfterEvent;

    // t
    "afterTargetBlockHit": TargetBlockHitAfterEvent;
    "tick": TickAfterEvent;
    "afterTripWireTrip": TripWireTripAfterEvent;

    // u

    // v

    // w
    "afterWeatherChange": WeatherChangeAfterEvent;
    "afterWorldInitialize": WorldInitializeAfterEvent;
    "afterWatchdogTerminate": WatchdogTerminateBeforeEvent;

    // x

    // y
    
    // z
}

/**
 * @beta
 * @author yuki2825624
 */
declare class ErrorAfterEvent {
    private constructor ();
    readonly error: Error;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class PlayerAttackAfterEvent {
    private constructor ();
    readonly player: Player;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class SendCustomCommandAfterEvent {
    private constructor ();
    readonly sender: Player;
    readonly commandName: string;
    readonly message?: string;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class ReadyAfterEvent {
    private constructor ();
}

/**
 * @beta
 * @author yuki2825624
 */
declare class TickAfterEvent { 
    private constructor (); 
    readonly currentTick: number;
    readonly deltaTime: number;
    readonly tps: number;
}
