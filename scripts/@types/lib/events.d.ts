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
    "blockExplode": BlockExplodeAfterEvent;
    "buttonPush": ButtonPushAfterEvent;

    // c
    "afterChatSend": ChatSendAfterEvent;
    "beforeChatSend": ChatSendBeforeEvent;

    // d
    "afterDataDrivenEntityTriggerEvent": DataDrivenEntityTriggerAfterEvent;
    "beforeDataDrivenEntityTriggerEvent": DataDrivenEntityTriggerBeforeEvent;

    // e
    "effectAdd": EffectAddAfterEvent;
    "entityDie": EntityDieAfterEvent;
    "entityHealthChanged": EntityHealthChangedAfterEvent;
    "entityHitBlock": EntityHitBlockAfterEvent;
    "entityHitEntity": EntityHitEntityAfterEvent;
    "entityHurt": EntityHurtAfterEvent;
    "entityLoad": EntityLoadAfterEvent;
    "error": ErrorAfterEvent;
    "afterEntityRemove": EntityRemoveAfterEvent;
    "beforeEntityRemove": EntityRemoveBeforeEvent;
    "entitySpawn": EntitySpawnAfterEvent;
    "afterExplosion": ExplosionAfterEvent;
    "beforeExplosion": ExplosionBeforeEvent;

    // f
    
    // g

    "afterGuildChat": GuildChatAfterEvent;
    "beforeGuildChat": GuildChatBeforeEvent;
    "guildJoin": GuildJoinAfterEvent;
    "guildLeave": GuildLeaveAfterEvent;
    "afterGuildRemove": GuildRemoveAfterEvent;
    "beforeGuildRemove": GuildRemoveBeforeEvent;

    // h

    // i
    "itemCompleteUse": ItemCompleteUseAfterEvent;
    "afterItemDefinitionEvent": ItemDefinitionAfterEventSignal;
    "beforeItemDefinitionEvent": ItemDefinitionBeforeEventSignal;
    "itemReleaseUse": ItemReleaseUseAfterEvent;
    "itemStartUse": ItemStartUseAfterEvent;
    "itemStartUseOn": ItemStartUseOnAfterEvent;
    "itemStopUse": ItemStopUseAfterEvent;
    "itemStopUseOn": ItemStopUseOnAfterEvent;
    "afterItemUse": ItemUseAfterEvent;
    "beforeItemUse": ItemUseBeforeEvent;
    "afterItemUseOn": ItemUseOnAfterEvent;
    "beforeItemUseOn": ItemUseOnBeforeEvent;

    // j

    // k

    // l
    "leverAction": LeverActionAfterEvent;

    // m
    "messageReceive": MessageReceiveAfterEvent;

    // n

    // o
    
    // p
    "pistonActivate": PistonActivateAfterEvent;
    "playerAttack": PlayerAttackAfterEvent;
    "afterPlayerBreakBlock": PlayerBreakBlockAfterEvent;
    "beforePlayerBreakBlock": PlayerBreakBlockBeforeEvent;
    "playerDimensionChange": PlayerDimensionChangeAfterEvent;
    "afterPlayerInteractWithBlock": PlayerInteractWithBlockAfterEvent;
    "beforePlayerInteractWithBlock": PlayerInteractWithBlockBeforeEvent;
    "afterPlayerInteractWithEntity": PlayerInteractWithEntityAfterEvent;
    "beforePlayerInteractWithEntity": PlayerInteractWithEntityBeforeEvent;
    "playerJoin": PlayerJoinAfterEvent;
    "afterPlayerLeave": PlayerLeaveAfterEvent;
    "beforePlayerLeave": PlayerLeaveBeforeEvent;
    "afterPlayerPlaceBlock": PlayerPlaceBlockAfterEvent;
    "beforePlayerPlaceBlock": PlayerPlaceBlockBeforeEvent;
    "playerSpawn": PlayerSpawnAfterEvent;
    "pressurePlatePop": PressurePlatePopAfterEvent;
    "pressurePlatePush": PressurePlatePushAfterEvent;
    "projectileHitBlock": ProjectileHitBlockAfterEvent;
    "projectileHitEntity": ProjectileHitEntityAfterEvent;

    // q

    // r
    "ready": ReadyAfterEvent;

    // s
    "scriptEventReceive": ScriptEventCommandMessageAfterEvent;
    "sendCustomCommand": SendCustomCommandAfterEvent;

    // t
    "targetBlockHit": TargetBlockHitAfterEvent;
    "tick": TickAfterEvent;
    "tripWireTrip": TripWireTripAfterEvent;

    // u

    // v

    // w
    "weatherChange": WeatherChangeAfterEvent;
    "worldInitialize": WorldInitializeAfterEvent;
    "watchdogTerminate": WatchdogTerminateBeforeEvent;

    // x

    // y
    
    // z
}

/**
 * @beta
 * @author yuki2825624
 */
declare class GuildChatAfterEvent {
    private constructor ();
    readonly sender: Account;
    readonly guild: Guild;
    readonly message: string;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class GuildChatBeforeEvent {
    private constructor ();
    readonly sender: Account;
    readonly guild: Guild;
    message: string;
    cancel: boolean;
    sendToPlayers: boolean;
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
declare class GuildJoinAfterEvent {
    private constructor ();
    readonly guild: Guild;
    readonly account: Account;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class GuildLeaveAfterEvent {
    private constructor ();
    readonly guild: Guild;
    readonly account: Account;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class GuildRemoveAfterEvent {
    private constructor ();
    readonly removedGuildId: string;
    readonly removedGuildName: string;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class GuildRemoveBeforeEvent {
    private constructor ();
    readonly removedGuild: Guild;
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
