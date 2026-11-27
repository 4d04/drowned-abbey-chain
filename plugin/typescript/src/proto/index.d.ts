import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace types. */
export namespace types {

    /** Properties of an Account. */
    interface IAccount {

        /** Account address */
        address?: (Uint8Array|null);

        /** Account amount */
        amount?: (number|Long|null);

        /** Account nonce */
        nonce?: (number|Long|null);
    }

    /** Represents an Account. */
    class Account implements IAccount {

        /**
         * Constructs a new Account.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IAccount);

        /** Account address. */
        public address: Uint8Array;

        /** Account amount. */
        public amount: (number|Long);

        /** Account nonce. */
        public nonce: (number|Long);

        /**
         * Creates a new Account instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Account instance
         */
        public static create(properties?: types.IAccount): types.Account;

        /**
         * Encodes the specified Account message. Does not implicitly {@link types.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Account message, length delimited. Does not implicitly {@link types.Account.verify|verify} messages.
         * @param message Account message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IAccount, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Account message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.Account;

        /**
         * Decodes an Account message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Account
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.Account;

        /**
         * Verifies an Account message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Account message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Account
         */
        public static fromObject(object: { [k: string]: any }): types.Account;

        /**
         * Creates a plain object from an Account message. Also converts values to other types if specified.
         * @param message Account
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.Account, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Account to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Account
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Pool. */
    interface IPool {

        /** Pool id */
        id?: (number|Long|null);

        /** Pool amount */
        amount?: (number|Long|null);
    }

    /** Represents a Pool. */
    class Pool implements IPool {

        /**
         * Constructs a new Pool.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPool);

        /** Pool id. */
        public id: (number|Long);

        /** Pool amount. */
        public amount: (number|Long);

        /**
         * Creates a new Pool instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Pool instance
         */
        public static create(properties?: types.IPool): types.Pool;

        /**
         * Encodes the specified Pool message. Does not implicitly {@link types.Pool.verify|verify} messages.
         * @param message Pool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPool, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Pool message, length delimited. Does not implicitly {@link types.Pool.verify|verify} messages.
         * @param message Pool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPool, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Pool message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Pool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.Pool;

        /**
         * Decodes a Pool message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Pool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.Pool;

        /**
         * Verifies a Pool message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Pool message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Pool
         */
        public static fromObject(object: { [k: string]: any }): types.Pool;

        /**
         * Creates a plain object from a Pool message. Also converts values to other types if specified.
         * @param message Pool
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.Pool, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Pool to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Pool
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Event. */
    interface IEvent {

        /** Event eventType */
        eventType?: (string|null);

        /** Event custom */
        custom?: (types.IEventCustom|null);

        /** Event height */
        height?: (number|Long|null);

        /** Event reference */
        reference?: (string|null);

        /** Event chainId */
        chainId?: (number|Long|null);

        /** Event blockHeight */
        blockHeight?: (number|Long|null);

        /** Event blockHash */
        blockHash?: (Uint8Array|null);

        /** Event address */
        address?: (Uint8Array|null);
    }

    /** Represents an Event. */
    class Event implements IEvent {

        /**
         * Constructs a new Event.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IEvent);

        /** Event eventType. */
        public eventType: string;

        /** Event custom. */
        public custom?: (types.IEventCustom|null);

        /** Event height. */
        public height: (number|Long);

        /** Event reference. */
        public reference: string;

        /** Event chainId. */
        public chainId: (number|Long);

        /** Event blockHeight. */
        public blockHeight: (number|Long);

        /** Event blockHash. */
        public blockHash: Uint8Array;

        /** Event address. */
        public address: Uint8Array;

        /** Event msg. */
        public msg?: "custom";

        /**
         * Creates a new Event instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Event instance
         */
        public static create(properties?: types.IEvent): types.Event;

        /**
         * Encodes the specified Event message. Does not implicitly {@link types.Event.verify|verify} messages.
         * @param message Event message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Event message, length delimited. Does not implicitly {@link types.Event.verify|verify} messages.
         * @param message Event message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Event message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Event
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.Event;

        /**
         * Decodes an Event message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Event
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.Event;

        /**
         * Verifies an Event message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Event message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Event
         */
        public static fromObject(object: { [k: string]: any }): types.Event;

        /**
         * Creates a plain object from an Event message. Also converts values to other types if specified.
         * @param message Event
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.Event, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Event to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Event
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EventCustom. */
    interface IEventCustom {

        /** EventCustom msg */
        msg?: (google.protobuf.IAny|null);
    }

    /** Represents an EventCustom. */
    class EventCustom implements IEventCustom {

        /**
         * Constructs a new EventCustom.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IEventCustom);

        /** EventCustom msg. */
        public msg?: (google.protobuf.IAny|null);

        /**
         * Creates a new EventCustom instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EventCustom instance
         */
        public static create(properties?: types.IEventCustom): types.EventCustom;

        /**
         * Encodes the specified EventCustom message. Does not implicitly {@link types.EventCustom.verify|verify} messages.
         * @param message EventCustom message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IEventCustom, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EventCustom message, length delimited. Does not implicitly {@link types.EventCustom.verify|verify} messages.
         * @param message EventCustom message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IEventCustom, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EventCustom message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EventCustom
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.EventCustom;

        /**
         * Decodes an EventCustom message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EventCustom
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.EventCustom;

        /**
         * Verifies an EventCustom message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EventCustom message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EventCustom
         */
        public static fromObject(object: { [k: string]: any }): types.EventCustom;

        /**
         * Creates a plain object from an EventCustom message. Also converts values to other types if specified.
         * @param message EventCustom
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.EventCustom, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EventCustom to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EventCustom
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FSMToPlugin. */
    interface IFSMToPlugin {

        /** FSMToPlugin id */
        id?: (number|Long|null);

        /** FSMToPlugin config */
        config?: (types.IPluginFSMConfig|null);

        /** FSMToPlugin genesis */
        genesis?: (types.IPluginGenesisRequest|null);

        /** FSMToPlugin begin */
        begin?: (types.IPluginBeginRequest|null);

        /** FSMToPlugin check */
        check?: (types.IPluginCheckRequest|null);

        /** FSMToPlugin deliver */
        deliver?: (types.IPluginDeliverRequest|null);

        /** FSMToPlugin end */
        end?: (types.IPluginEndRequest|null);

        /** FSMToPlugin stateRead */
        stateRead?: (types.IPluginStateReadResponse|null);

        /** FSMToPlugin stateWrite */
        stateWrite?: (types.IPluginStateWriteResponse|null);

        /** FSMToPlugin query */
        query?: (types.IPluginQueryResponse|null);

        /** FSMToPlugin error */
        error?: (types.IPluginError|null);
    }

    /** Represents a FSMToPlugin. */
    class FSMToPlugin implements IFSMToPlugin {

        /**
         * Constructs a new FSMToPlugin.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IFSMToPlugin);

        /** FSMToPlugin id. */
        public id: (number|Long);

        /** FSMToPlugin config. */
        public config?: (types.IPluginFSMConfig|null);

        /** FSMToPlugin genesis. */
        public genesis?: (types.IPluginGenesisRequest|null);

        /** FSMToPlugin begin. */
        public begin?: (types.IPluginBeginRequest|null);

        /** FSMToPlugin check. */
        public check?: (types.IPluginCheckRequest|null);

        /** FSMToPlugin deliver. */
        public deliver?: (types.IPluginDeliverRequest|null);

        /** FSMToPlugin end. */
        public end?: (types.IPluginEndRequest|null);

        /** FSMToPlugin stateRead. */
        public stateRead?: (types.IPluginStateReadResponse|null);

        /** FSMToPlugin stateWrite. */
        public stateWrite?: (types.IPluginStateWriteResponse|null);

        /** FSMToPlugin query. */
        public query?: (types.IPluginQueryResponse|null);

        /** FSMToPlugin error. */
        public error?: (types.IPluginError|null);

        /** FSMToPlugin payload. */
        public payload?: ("config"|"genesis"|"begin"|"check"|"deliver"|"end"|"stateRead"|"stateWrite"|"query"|"error");

        /**
         * Creates a new FSMToPlugin instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FSMToPlugin instance
         */
        public static create(properties?: types.IFSMToPlugin): types.FSMToPlugin;

        /**
         * Encodes the specified FSMToPlugin message. Does not implicitly {@link types.FSMToPlugin.verify|verify} messages.
         * @param message FSMToPlugin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IFSMToPlugin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FSMToPlugin message, length delimited. Does not implicitly {@link types.FSMToPlugin.verify|verify} messages.
         * @param message FSMToPlugin message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IFSMToPlugin, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FSMToPlugin message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FSMToPlugin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.FSMToPlugin;

        /**
         * Decodes a FSMToPlugin message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FSMToPlugin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.FSMToPlugin;

        /**
         * Verifies a FSMToPlugin message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FSMToPlugin message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FSMToPlugin
         */
        public static fromObject(object: { [k: string]: any }): types.FSMToPlugin;

        /**
         * Creates a plain object from a FSMToPlugin message. Also converts values to other types if specified.
         * @param message FSMToPlugin
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.FSMToPlugin, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FSMToPlugin to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FSMToPlugin
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginToFSM. */
    interface IPluginToFSM {

        /** PluginToFSM id */
        id?: (number|Long|null);

        /** PluginToFSM config */
        config?: (types.IPluginConfig|null);

        /** PluginToFSM genesis */
        genesis?: (types.IPluginGenesisResponse|null);

        /** PluginToFSM begin */
        begin?: (types.IPluginBeginResponse|null);

        /** PluginToFSM check */
        check?: (types.IPluginCheckResponse|null);

        /** PluginToFSM deliver */
        deliver?: (types.IPluginDeliverResponse|null);

        /** PluginToFSM end */
        end?: (types.IPluginEndResponse|null);

        /** PluginToFSM stateRead */
        stateRead?: (types.IPluginStateReadRequest|null);

        /** PluginToFSM stateWrite */
        stateWrite?: (types.IPluginStateWriteRequest|null);

        /** PluginToFSM query */
        query?: (types.IPluginQueryRequest|null);
    }

    /** Represents a PluginToFSM. */
    class PluginToFSM implements IPluginToFSM {

        /**
         * Constructs a new PluginToFSM.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginToFSM);

        /** PluginToFSM id. */
        public id: (number|Long);

        /** PluginToFSM config. */
        public config?: (types.IPluginConfig|null);

        /** PluginToFSM genesis. */
        public genesis?: (types.IPluginGenesisResponse|null);

        /** PluginToFSM begin. */
        public begin?: (types.IPluginBeginResponse|null);

        /** PluginToFSM check. */
        public check?: (types.IPluginCheckResponse|null);

        /** PluginToFSM deliver. */
        public deliver?: (types.IPluginDeliverResponse|null);

        /** PluginToFSM end. */
        public end?: (types.IPluginEndResponse|null);

        /** PluginToFSM stateRead. */
        public stateRead?: (types.IPluginStateReadRequest|null);

        /** PluginToFSM stateWrite. */
        public stateWrite?: (types.IPluginStateWriteRequest|null);

        /** PluginToFSM query. */
        public query?: (types.IPluginQueryRequest|null);

        /** PluginToFSM payload. */
        public payload?: ("config"|"genesis"|"begin"|"check"|"deliver"|"end"|"stateRead"|"stateWrite"|"query");

        /**
         * Creates a new PluginToFSM instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginToFSM instance
         */
        public static create(properties?: types.IPluginToFSM): types.PluginToFSM;

        /**
         * Encodes the specified PluginToFSM message. Does not implicitly {@link types.PluginToFSM.verify|verify} messages.
         * @param message PluginToFSM message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginToFSM, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginToFSM message, length delimited. Does not implicitly {@link types.PluginToFSM.verify|verify} messages.
         * @param message PluginToFSM message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginToFSM, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginToFSM message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginToFSM
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginToFSM;

        /**
         * Decodes a PluginToFSM message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginToFSM
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginToFSM;

        /**
         * Verifies a PluginToFSM message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginToFSM message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginToFSM
         */
        public static fromObject(object: { [k: string]: any }): types.PluginToFSM;

        /**
         * Creates a plain object from a PluginToFSM message. Also converts values to other types if specified.
         * @param message PluginToFSM
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginToFSM, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginToFSM to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginToFSM
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginConfig. */
    interface IPluginConfig {

        /** PluginConfig name */
        name?: (string|null);

        /** PluginConfig id */
        id?: (number|Long|null);

        /** PluginConfig version */
        version?: (number|Long|null);

        /** PluginConfig supportedTransactions */
        supportedTransactions?: (string[]|null);

        /** PluginConfig fileDescriptorProtos */
        fileDescriptorProtos?: (Uint8Array[]|null);

        /** PluginConfig transactionTypeUrls */
        transactionTypeUrls?: (string[]|null);

        /** PluginConfig eventTypeUrls */
        eventTypeUrls?: (string[]|null);

        /** PluginConfig customStatePrefixes */
        customStatePrefixes?: (Uint8Array[]|null);
    }

    /** Represents a PluginConfig. */
    class PluginConfig implements IPluginConfig {

        /**
         * Constructs a new PluginConfig.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginConfig);

        /** PluginConfig name. */
        public name: string;

        /** PluginConfig id. */
        public id: (number|Long);

        /** PluginConfig version. */
        public version: (number|Long);

        /** PluginConfig supportedTransactions. */
        public supportedTransactions: string[];

        /** PluginConfig fileDescriptorProtos. */
        public fileDescriptorProtos: Uint8Array[];

        /** PluginConfig transactionTypeUrls. */
        public transactionTypeUrls: string[];

        /** PluginConfig eventTypeUrls. */
        public eventTypeUrls: string[];

        /** PluginConfig customStatePrefixes. */
        public customStatePrefixes: Uint8Array[];

        /**
         * Creates a new PluginConfig instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginConfig instance
         */
        public static create(properties?: types.IPluginConfig): types.PluginConfig;

        /**
         * Encodes the specified PluginConfig message. Does not implicitly {@link types.PluginConfig.verify|verify} messages.
         * @param message PluginConfig message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginConfig, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginConfig message, length delimited. Does not implicitly {@link types.PluginConfig.verify|verify} messages.
         * @param message PluginConfig message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginConfig, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginConfig message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginConfig
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginConfig;

        /**
         * Decodes a PluginConfig message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginConfig
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginConfig;

        /**
         * Verifies a PluginConfig message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginConfig message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginConfig
         */
        public static fromObject(object: { [k: string]: any }): types.PluginConfig;

        /**
         * Creates a plain object from a PluginConfig message. Also converts values to other types if specified.
         * @param message PluginConfig
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginConfig to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginConfig
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginFSMConfig. */
    interface IPluginFSMConfig {

        /** PluginFSMConfig config */
        config?: (types.IPluginConfig|null);
    }

    /** Represents a PluginFSMConfig. */
    class PluginFSMConfig implements IPluginFSMConfig {

        /**
         * Constructs a new PluginFSMConfig.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginFSMConfig);

        /** PluginFSMConfig config. */
        public config?: (types.IPluginConfig|null);

        /**
         * Creates a new PluginFSMConfig instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginFSMConfig instance
         */
        public static create(properties?: types.IPluginFSMConfig): types.PluginFSMConfig;

        /**
         * Encodes the specified PluginFSMConfig message. Does not implicitly {@link types.PluginFSMConfig.verify|verify} messages.
         * @param message PluginFSMConfig message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginFSMConfig, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginFSMConfig message, length delimited. Does not implicitly {@link types.PluginFSMConfig.verify|verify} messages.
         * @param message PluginFSMConfig message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginFSMConfig, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginFSMConfig message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginFSMConfig
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginFSMConfig;

        /**
         * Decodes a PluginFSMConfig message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginFSMConfig
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginFSMConfig;

        /**
         * Verifies a PluginFSMConfig message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginFSMConfig message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginFSMConfig
         */
        public static fromObject(object: { [k: string]: any }): types.PluginFSMConfig;

        /**
         * Creates a plain object from a PluginFSMConfig message. Also converts values to other types if specified.
         * @param message PluginFSMConfig
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginFSMConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginFSMConfig to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginFSMConfig
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginGenesisRequest. */
    interface IPluginGenesisRequest {

        /** PluginGenesisRequest genesisJson */
        genesisJson?: (Uint8Array|null);
    }

    /** Represents a PluginGenesisRequest. */
    class PluginGenesisRequest implements IPluginGenesisRequest {

        /**
         * Constructs a new PluginGenesisRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginGenesisRequest);

        /** PluginGenesisRequest genesisJson. */
        public genesisJson: Uint8Array;

        /**
         * Creates a new PluginGenesisRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginGenesisRequest instance
         */
        public static create(properties?: types.IPluginGenesisRequest): types.PluginGenesisRequest;

        /**
         * Encodes the specified PluginGenesisRequest message. Does not implicitly {@link types.PluginGenesisRequest.verify|verify} messages.
         * @param message PluginGenesisRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginGenesisRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginGenesisRequest message, length delimited. Does not implicitly {@link types.PluginGenesisRequest.verify|verify} messages.
         * @param message PluginGenesisRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginGenesisRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginGenesisRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginGenesisRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginGenesisRequest;

        /**
         * Decodes a PluginGenesisRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginGenesisRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginGenesisRequest;

        /**
         * Verifies a PluginGenesisRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginGenesisRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginGenesisRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginGenesisRequest;

        /**
         * Creates a plain object from a PluginGenesisRequest message. Also converts values to other types if specified.
         * @param message PluginGenesisRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginGenesisRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginGenesisRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginGenesisRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginGenesisResponse. */
    interface IPluginGenesisResponse {

        /** PluginGenesisResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginGenesisResponse. */
    class PluginGenesisResponse implements IPluginGenesisResponse {

        /**
         * Constructs a new PluginGenesisResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginGenesisResponse);

        /** PluginGenesisResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginGenesisResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginGenesisResponse instance
         */
        public static create(properties?: types.IPluginGenesisResponse): types.PluginGenesisResponse;

        /**
         * Encodes the specified PluginGenesisResponse message. Does not implicitly {@link types.PluginGenesisResponse.verify|verify} messages.
         * @param message PluginGenesisResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginGenesisResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginGenesisResponse message, length delimited. Does not implicitly {@link types.PluginGenesisResponse.verify|verify} messages.
         * @param message PluginGenesisResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginGenesisResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginGenesisResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginGenesisResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginGenesisResponse;

        /**
         * Decodes a PluginGenesisResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginGenesisResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginGenesisResponse;

        /**
         * Verifies a PluginGenesisResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginGenesisResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginGenesisResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginGenesisResponse;

        /**
         * Creates a plain object from a PluginGenesisResponse message. Also converts values to other types if specified.
         * @param message PluginGenesisResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginGenesisResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginGenesisResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginGenesisResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginBeginRequest. */
    interface IPluginBeginRequest {

        /** PluginBeginRequest height */
        height?: (number|Long|null);
    }

    /** Represents a PluginBeginRequest. */
    class PluginBeginRequest implements IPluginBeginRequest {

        /**
         * Constructs a new PluginBeginRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginBeginRequest);

        /** PluginBeginRequest height. */
        public height: (number|Long);

        /**
         * Creates a new PluginBeginRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginBeginRequest instance
         */
        public static create(properties?: types.IPluginBeginRequest): types.PluginBeginRequest;

        /**
         * Encodes the specified PluginBeginRequest message. Does not implicitly {@link types.PluginBeginRequest.verify|verify} messages.
         * @param message PluginBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginBeginRequest message, length delimited. Does not implicitly {@link types.PluginBeginRequest.verify|verify} messages.
         * @param message PluginBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginBeginRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginBeginRequest;

        /**
         * Decodes a PluginBeginRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginBeginRequest;

        /**
         * Verifies a PluginBeginRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginBeginRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginBeginRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginBeginRequest;

        /**
         * Creates a plain object from a PluginBeginRequest message. Also converts values to other types if specified.
         * @param message PluginBeginRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginBeginRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginBeginRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginBeginRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginBeginResponse. */
    interface IPluginBeginResponse {

        /** PluginBeginResponse events */
        events?: (types.IEvent[]|null);

        /** PluginBeginResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginBeginResponse. */
    class PluginBeginResponse implements IPluginBeginResponse {

        /**
         * Constructs a new PluginBeginResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginBeginResponse);

        /** PluginBeginResponse events. */
        public events: types.IEvent[];

        /** PluginBeginResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginBeginResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginBeginResponse instance
         */
        public static create(properties?: types.IPluginBeginResponse): types.PluginBeginResponse;

        /**
         * Encodes the specified PluginBeginResponse message. Does not implicitly {@link types.PluginBeginResponse.verify|verify} messages.
         * @param message PluginBeginResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginBeginResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginBeginResponse message, length delimited. Does not implicitly {@link types.PluginBeginResponse.verify|verify} messages.
         * @param message PluginBeginResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginBeginResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginBeginResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginBeginResponse;

        /**
         * Decodes a PluginBeginResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginBeginResponse;

        /**
         * Verifies a PluginBeginResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginBeginResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginBeginResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginBeginResponse;

        /**
         * Creates a plain object from a PluginBeginResponse message. Also converts values to other types if specified.
         * @param message PluginBeginResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginBeginResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginBeginResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginBeginResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginCheckRequest. */
    interface IPluginCheckRequest {

        /** PluginCheckRequest tx */
        tx?: (types.ITransaction|null);

        /** PluginCheckRequest height */
        height?: (number|Long|null);
    }

    /** Represents a PluginCheckRequest. */
    class PluginCheckRequest implements IPluginCheckRequest {

        /**
         * Constructs a new PluginCheckRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginCheckRequest);

        /** PluginCheckRequest tx. */
        public tx?: (types.ITransaction|null);

        /** PluginCheckRequest height. */
        public height: (number|Long);

        /**
         * Creates a new PluginCheckRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginCheckRequest instance
         */
        public static create(properties?: types.IPluginCheckRequest): types.PluginCheckRequest;

        /**
         * Encodes the specified PluginCheckRequest message. Does not implicitly {@link types.PluginCheckRequest.verify|verify} messages.
         * @param message PluginCheckRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginCheckRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginCheckRequest message, length delimited. Does not implicitly {@link types.PluginCheckRequest.verify|verify} messages.
         * @param message PluginCheckRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginCheckRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginCheckRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginCheckRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginCheckRequest;

        /**
         * Decodes a PluginCheckRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginCheckRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginCheckRequest;

        /**
         * Verifies a PluginCheckRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginCheckRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginCheckRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginCheckRequest;

        /**
         * Creates a plain object from a PluginCheckRequest message. Also converts values to other types if specified.
         * @param message PluginCheckRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginCheckRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginCheckRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginCheckRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginCheckResponse. */
    interface IPluginCheckResponse {

        /** PluginCheckResponse authorizedSigners */
        authorizedSigners?: (Uint8Array[]|null);

        /** PluginCheckResponse recipient */
        recipient?: (Uint8Array|null);

        /** PluginCheckResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginCheckResponse. */
    class PluginCheckResponse implements IPluginCheckResponse {

        /**
         * Constructs a new PluginCheckResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginCheckResponse);

        /** PluginCheckResponse authorizedSigners. */
        public authorizedSigners: Uint8Array[];

        /** PluginCheckResponse recipient. */
        public recipient: Uint8Array;

        /** PluginCheckResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginCheckResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginCheckResponse instance
         */
        public static create(properties?: types.IPluginCheckResponse): types.PluginCheckResponse;

        /**
         * Encodes the specified PluginCheckResponse message. Does not implicitly {@link types.PluginCheckResponse.verify|verify} messages.
         * @param message PluginCheckResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginCheckResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginCheckResponse message, length delimited. Does not implicitly {@link types.PluginCheckResponse.verify|verify} messages.
         * @param message PluginCheckResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginCheckResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginCheckResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginCheckResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginCheckResponse;

        /**
         * Decodes a PluginCheckResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginCheckResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginCheckResponse;

        /**
         * Verifies a PluginCheckResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginCheckResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginCheckResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginCheckResponse;

        /**
         * Creates a plain object from a PluginCheckResponse message. Also converts values to other types if specified.
         * @param message PluginCheckResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginCheckResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginCheckResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginCheckResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginDeliverRequest. */
    interface IPluginDeliverRequest {

        /** PluginDeliverRequest tx */
        tx?: (types.ITransaction|null);

        /** PluginDeliverRequest height */
        height?: (number|Long|null);
    }

    /** Represents a PluginDeliverRequest. */
    class PluginDeliverRequest implements IPluginDeliverRequest {

        /**
         * Constructs a new PluginDeliverRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginDeliverRequest);

        /** PluginDeliverRequest tx. */
        public tx?: (types.ITransaction|null);

        /** PluginDeliverRequest height. */
        public height: (number|Long);

        /**
         * Creates a new PluginDeliverRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginDeliverRequest instance
         */
        public static create(properties?: types.IPluginDeliverRequest): types.PluginDeliverRequest;

        /**
         * Encodes the specified PluginDeliverRequest message. Does not implicitly {@link types.PluginDeliverRequest.verify|verify} messages.
         * @param message PluginDeliverRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginDeliverRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginDeliverRequest message, length delimited. Does not implicitly {@link types.PluginDeliverRequest.verify|verify} messages.
         * @param message PluginDeliverRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginDeliverRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginDeliverRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginDeliverRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginDeliverRequest;

        /**
         * Decodes a PluginDeliverRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginDeliverRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginDeliverRequest;

        /**
         * Verifies a PluginDeliverRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginDeliverRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginDeliverRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginDeliverRequest;

        /**
         * Creates a plain object from a PluginDeliverRequest message. Also converts values to other types if specified.
         * @param message PluginDeliverRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginDeliverRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginDeliverRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginDeliverRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginDeliverResponse. */
    interface IPluginDeliverResponse {

        /** PluginDeliverResponse events */
        events?: (types.IEvent[]|null);

        /** PluginDeliverResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginDeliverResponse. */
    class PluginDeliverResponse implements IPluginDeliverResponse {

        /**
         * Constructs a new PluginDeliverResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginDeliverResponse);

        /** PluginDeliverResponse events. */
        public events: types.IEvent[];

        /** PluginDeliverResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginDeliverResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginDeliverResponse instance
         */
        public static create(properties?: types.IPluginDeliverResponse): types.PluginDeliverResponse;

        /**
         * Encodes the specified PluginDeliverResponse message. Does not implicitly {@link types.PluginDeliverResponse.verify|verify} messages.
         * @param message PluginDeliverResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginDeliverResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginDeliverResponse message, length delimited. Does not implicitly {@link types.PluginDeliverResponse.verify|verify} messages.
         * @param message PluginDeliverResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginDeliverResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginDeliverResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginDeliverResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginDeliverResponse;

        /**
         * Decodes a PluginDeliverResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginDeliverResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginDeliverResponse;

        /**
         * Verifies a PluginDeliverResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginDeliverResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginDeliverResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginDeliverResponse;

        /**
         * Creates a plain object from a PluginDeliverResponse message. Also converts values to other types if specified.
         * @param message PluginDeliverResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginDeliverResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginDeliverResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginDeliverResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginEndRequest. */
    interface IPluginEndRequest {

        /** PluginEndRequest height */
        height?: (number|Long|null);

        /** PluginEndRequest proposerAddress */
        proposerAddress?: (Uint8Array|null);
    }

    /** Represents a PluginEndRequest. */
    class PluginEndRequest implements IPluginEndRequest {

        /**
         * Constructs a new PluginEndRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginEndRequest);

        /** PluginEndRequest height. */
        public height: (number|Long);

        /** PluginEndRequest proposerAddress. */
        public proposerAddress: Uint8Array;

        /**
         * Creates a new PluginEndRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginEndRequest instance
         */
        public static create(properties?: types.IPluginEndRequest): types.PluginEndRequest;

        /**
         * Encodes the specified PluginEndRequest message. Does not implicitly {@link types.PluginEndRequest.verify|verify} messages.
         * @param message PluginEndRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginEndRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginEndRequest message, length delimited. Does not implicitly {@link types.PluginEndRequest.verify|verify} messages.
         * @param message PluginEndRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginEndRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginEndRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginEndRequest;

        /**
         * Decodes a PluginEndRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginEndRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginEndRequest;

        /**
         * Verifies a PluginEndRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginEndRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginEndRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginEndRequest;

        /**
         * Creates a plain object from a PluginEndRequest message. Also converts values to other types if specified.
         * @param message PluginEndRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginEndRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginEndRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginEndRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginEndResponse. */
    interface IPluginEndResponse {

        /** PluginEndResponse events */
        events?: (types.IEvent[]|null);

        /** PluginEndResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginEndResponse. */
    class PluginEndResponse implements IPluginEndResponse {

        /**
         * Constructs a new PluginEndResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginEndResponse);

        /** PluginEndResponse events. */
        public events: types.IEvent[];

        /** PluginEndResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginEndResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginEndResponse instance
         */
        public static create(properties?: types.IPluginEndResponse): types.PluginEndResponse;

        /**
         * Encodes the specified PluginEndResponse message. Does not implicitly {@link types.PluginEndResponse.verify|verify} messages.
         * @param message PluginEndResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginEndResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginEndResponse message, length delimited. Does not implicitly {@link types.PluginEndResponse.verify|verify} messages.
         * @param message PluginEndResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginEndResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginEndResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginEndResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginEndResponse;

        /**
         * Decodes a PluginEndResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginEndResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginEndResponse;

        /**
         * Verifies a PluginEndResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginEndResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginEndResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginEndResponse;

        /**
         * Creates a plain object from a PluginEndResponse message. Also converts values to other types if specified.
         * @param message PluginEndResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginEndResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginEndResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginEndResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginError. */
    interface IPluginError {

        /** PluginError code */
        code?: (number|Long|null);

        /** PluginError module */
        module?: (string|null);

        /** PluginError msg */
        msg?: (string|null);
    }

    /** Represents a PluginError. */
    class PluginError implements IPluginError {

        /**
         * Constructs a new PluginError.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginError);

        /** PluginError code. */
        public code: (number|Long);

        /** PluginError module. */
        public module: string;

        /** PluginError msg. */
        public msg: string;

        /**
         * Creates a new PluginError instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginError instance
         */
        public static create(properties?: types.IPluginError): types.PluginError;

        /**
         * Encodes the specified PluginError message. Does not implicitly {@link types.PluginError.verify|verify} messages.
         * @param message PluginError message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginError, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginError message, length delimited. Does not implicitly {@link types.PluginError.verify|verify} messages.
         * @param message PluginError message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginError, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginError message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginError
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginError;

        /**
         * Decodes a PluginError message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginError
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginError;

        /**
         * Verifies a PluginError message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginError message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginError
         */
        public static fromObject(object: { [k: string]: any }): types.PluginError;

        /**
         * Creates a plain object from a PluginError message. Also converts values to other types if specified.
         * @param message PluginError
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginError, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginError to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginError
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginQueryRequest. */
    interface IPluginQueryRequest {

        /** PluginQueryRequest height */
        height?: (number|Long|null);

        /** PluginQueryRequest read */
        read?: (types.IPluginStateReadRequest|null);
    }

    /** Represents a PluginQueryRequest. */
    class PluginQueryRequest implements IPluginQueryRequest {

        /**
         * Constructs a new PluginQueryRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginQueryRequest);

        /** PluginQueryRequest height. */
        public height: (number|Long);

        /** PluginQueryRequest read. */
        public read?: (types.IPluginStateReadRequest|null);

        /**
         * Creates a new PluginQueryRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginQueryRequest instance
         */
        public static create(properties?: types.IPluginQueryRequest): types.PluginQueryRequest;

        /**
         * Encodes the specified PluginQueryRequest message. Does not implicitly {@link types.PluginQueryRequest.verify|verify} messages.
         * @param message PluginQueryRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginQueryRequest message, length delimited. Does not implicitly {@link types.PluginQueryRequest.verify|verify} messages.
         * @param message PluginQueryRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginQueryRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginQueryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginQueryRequest;

        /**
         * Decodes a PluginQueryRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginQueryRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginQueryRequest;

        /**
         * Verifies a PluginQueryRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginQueryRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginQueryRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginQueryRequest;

        /**
         * Creates a plain object from a PluginQueryRequest message. Also converts values to other types if specified.
         * @param message PluginQueryRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginQueryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginQueryRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginQueryRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginQueryResponse. */
    interface IPluginQueryResponse {

        /** PluginQueryResponse read */
        read?: (types.IPluginStateReadResponse|null);

        /** PluginQueryResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginQueryResponse. */
    class PluginQueryResponse implements IPluginQueryResponse {

        /**
         * Constructs a new PluginQueryResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginQueryResponse);

        /** PluginQueryResponse read. */
        public read?: (types.IPluginStateReadResponse|null);

        /** PluginQueryResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginQueryResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginQueryResponse instance
         */
        public static create(properties?: types.IPluginQueryResponse): types.PluginQueryResponse;

        /**
         * Encodes the specified PluginQueryResponse message. Does not implicitly {@link types.PluginQueryResponse.verify|verify} messages.
         * @param message PluginQueryResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginQueryResponse message, length delimited. Does not implicitly {@link types.PluginQueryResponse.verify|verify} messages.
         * @param message PluginQueryResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginQueryResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginQueryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginQueryResponse;

        /**
         * Decodes a PluginQueryResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginQueryResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginQueryResponse;

        /**
         * Verifies a PluginQueryResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginQueryResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginQueryResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginQueryResponse;

        /**
         * Creates a plain object from a PluginQueryResponse message. Also converts values to other types if specified.
         * @param message PluginQueryResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginQueryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginQueryResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginQueryResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginStateReadRequest. */
    interface IPluginStateReadRequest {

        /** PluginStateReadRequest keys */
        keys?: (types.IPluginKeyRead[]|null);

        /** PluginStateReadRequest ranges */
        ranges?: (types.IPluginRangeRead[]|null);
    }

    /** Represents a PluginStateReadRequest. */
    class PluginStateReadRequest implements IPluginStateReadRequest {

        /**
         * Constructs a new PluginStateReadRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginStateReadRequest);

        /** PluginStateReadRequest keys. */
        public keys: types.IPluginKeyRead[];

        /** PluginStateReadRequest ranges. */
        public ranges: types.IPluginRangeRead[];

        /**
         * Creates a new PluginStateReadRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginStateReadRequest instance
         */
        public static create(properties?: types.IPluginStateReadRequest): types.PluginStateReadRequest;

        /**
         * Encodes the specified PluginStateReadRequest message. Does not implicitly {@link types.PluginStateReadRequest.verify|verify} messages.
         * @param message PluginStateReadRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginStateReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginStateReadRequest message, length delimited. Does not implicitly {@link types.PluginStateReadRequest.verify|verify} messages.
         * @param message PluginStateReadRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginStateReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginStateReadRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginStateReadRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginStateReadRequest;

        /**
         * Decodes a PluginStateReadRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginStateReadRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginStateReadRequest;

        /**
         * Verifies a PluginStateReadRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginStateReadRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginStateReadRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginStateReadRequest;

        /**
         * Creates a plain object from a PluginStateReadRequest message. Also converts values to other types if specified.
         * @param message PluginStateReadRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginStateReadRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginStateReadRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginStateReadRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginKeyRead. */
    interface IPluginKeyRead {

        /** PluginKeyRead queryId */
        queryId?: (number|Long|null);

        /** PluginKeyRead key */
        key?: (Uint8Array|null);
    }

    /** Represents a PluginKeyRead. */
    class PluginKeyRead implements IPluginKeyRead {

        /**
         * Constructs a new PluginKeyRead.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginKeyRead);

        /** PluginKeyRead queryId. */
        public queryId: (number|Long);

        /** PluginKeyRead key. */
        public key: Uint8Array;

        /**
         * Creates a new PluginKeyRead instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginKeyRead instance
         */
        public static create(properties?: types.IPluginKeyRead): types.PluginKeyRead;

        /**
         * Encodes the specified PluginKeyRead message. Does not implicitly {@link types.PluginKeyRead.verify|verify} messages.
         * @param message PluginKeyRead message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginKeyRead, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginKeyRead message, length delimited. Does not implicitly {@link types.PluginKeyRead.verify|verify} messages.
         * @param message PluginKeyRead message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginKeyRead, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginKeyRead message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginKeyRead
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginKeyRead;

        /**
         * Decodes a PluginKeyRead message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginKeyRead
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginKeyRead;

        /**
         * Verifies a PluginKeyRead message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginKeyRead message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginKeyRead
         */
        public static fromObject(object: { [k: string]: any }): types.PluginKeyRead;

        /**
         * Creates a plain object from a PluginKeyRead message. Also converts values to other types if specified.
         * @param message PluginKeyRead
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginKeyRead, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginKeyRead to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginKeyRead
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginRangeRead. */
    interface IPluginRangeRead {

        /** PluginRangeRead queryId */
        queryId?: (number|Long|null);

        /** PluginRangeRead prefix */
        prefix?: (Uint8Array|null);

        /** PluginRangeRead limit */
        limit?: (number|Long|null);

        /** PluginRangeRead reverse */
        reverse?: (boolean|null);
    }

    /** Represents a PluginRangeRead. */
    class PluginRangeRead implements IPluginRangeRead {

        /**
         * Constructs a new PluginRangeRead.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginRangeRead);

        /** PluginRangeRead queryId. */
        public queryId: (number|Long);

        /** PluginRangeRead prefix. */
        public prefix: Uint8Array;

        /** PluginRangeRead limit. */
        public limit: (number|Long);

        /** PluginRangeRead reverse. */
        public reverse: boolean;

        /**
         * Creates a new PluginRangeRead instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginRangeRead instance
         */
        public static create(properties?: types.IPluginRangeRead): types.PluginRangeRead;

        /**
         * Encodes the specified PluginRangeRead message. Does not implicitly {@link types.PluginRangeRead.verify|verify} messages.
         * @param message PluginRangeRead message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginRangeRead, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginRangeRead message, length delimited. Does not implicitly {@link types.PluginRangeRead.verify|verify} messages.
         * @param message PluginRangeRead message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginRangeRead, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginRangeRead message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginRangeRead
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginRangeRead;

        /**
         * Decodes a PluginRangeRead message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginRangeRead
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginRangeRead;

        /**
         * Verifies a PluginRangeRead message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginRangeRead message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginRangeRead
         */
        public static fromObject(object: { [k: string]: any }): types.PluginRangeRead;

        /**
         * Creates a plain object from a PluginRangeRead message. Also converts values to other types if specified.
         * @param message PluginRangeRead
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginRangeRead, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginRangeRead to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginRangeRead
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginStateReadResponse. */
    interface IPluginStateReadResponse {

        /** PluginStateReadResponse results */
        results?: (types.IPluginReadResult[]|null);

        /** PluginStateReadResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginStateReadResponse. */
    class PluginStateReadResponse implements IPluginStateReadResponse {

        /**
         * Constructs a new PluginStateReadResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginStateReadResponse);

        /** PluginStateReadResponse results. */
        public results: types.IPluginReadResult[];

        /** PluginStateReadResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginStateReadResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginStateReadResponse instance
         */
        public static create(properties?: types.IPluginStateReadResponse): types.PluginStateReadResponse;

        /**
         * Encodes the specified PluginStateReadResponse message. Does not implicitly {@link types.PluginStateReadResponse.verify|verify} messages.
         * @param message PluginStateReadResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginStateReadResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginStateReadResponse message, length delimited. Does not implicitly {@link types.PluginStateReadResponse.verify|verify} messages.
         * @param message PluginStateReadResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginStateReadResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginStateReadResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginStateReadResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginStateReadResponse;

        /**
         * Decodes a PluginStateReadResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginStateReadResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginStateReadResponse;

        /**
         * Verifies a PluginStateReadResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginStateReadResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginStateReadResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginStateReadResponse;

        /**
         * Creates a plain object from a PluginStateReadResponse message. Also converts values to other types if specified.
         * @param message PluginStateReadResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginStateReadResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginStateReadResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginStateReadResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginReadResult. */
    interface IPluginReadResult {

        /** PluginReadResult queryId */
        queryId?: (number|Long|null);

        /** PluginReadResult entries */
        entries?: (types.IPluginStateEntry[]|null);
    }

    /** Represents a PluginReadResult. */
    class PluginReadResult implements IPluginReadResult {

        /**
         * Constructs a new PluginReadResult.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginReadResult);

        /** PluginReadResult queryId. */
        public queryId: (number|Long);

        /** PluginReadResult entries. */
        public entries: types.IPluginStateEntry[];

        /**
         * Creates a new PluginReadResult instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginReadResult instance
         */
        public static create(properties?: types.IPluginReadResult): types.PluginReadResult;

        /**
         * Encodes the specified PluginReadResult message. Does not implicitly {@link types.PluginReadResult.verify|verify} messages.
         * @param message PluginReadResult message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginReadResult, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginReadResult message, length delimited. Does not implicitly {@link types.PluginReadResult.verify|verify} messages.
         * @param message PluginReadResult message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginReadResult, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginReadResult message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginReadResult
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginReadResult;

        /**
         * Decodes a PluginReadResult message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginReadResult
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginReadResult;

        /**
         * Verifies a PluginReadResult message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginReadResult message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginReadResult
         */
        public static fromObject(object: { [k: string]: any }): types.PluginReadResult;

        /**
         * Creates a plain object from a PluginReadResult message. Also converts values to other types if specified.
         * @param message PluginReadResult
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginReadResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginReadResult to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginReadResult
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginStateWriteRequest. */
    interface IPluginStateWriteRequest {

        /** PluginStateWriteRequest sets */
        sets?: (types.IPluginSetOp[]|null);

        /** PluginStateWriteRequest deletes */
        deletes?: (types.IPluginDeleteOp[]|null);
    }

    /** Represents a PluginStateWriteRequest. */
    class PluginStateWriteRequest implements IPluginStateWriteRequest {

        /**
         * Constructs a new PluginStateWriteRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginStateWriteRequest);

        /** PluginStateWriteRequest sets. */
        public sets: types.IPluginSetOp[];

        /** PluginStateWriteRequest deletes. */
        public deletes: types.IPluginDeleteOp[];

        /**
         * Creates a new PluginStateWriteRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginStateWriteRequest instance
         */
        public static create(properties?: types.IPluginStateWriteRequest): types.PluginStateWriteRequest;

        /**
         * Encodes the specified PluginStateWriteRequest message. Does not implicitly {@link types.PluginStateWriteRequest.verify|verify} messages.
         * @param message PluginStateWriteRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginStateWriteRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginStateWriteRequest message, length delimited. Does not implicitly {@link types.PluginStateWriteRequest.verify|verify} messages.
         * @param message PluginStateWriteRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginStateWriteRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginStateWriteRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginStateWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginStateWriteRequest;

        /**
         * Decodes a PluginStateWriteRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginStateWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginStateWriteRequest;

        /**
         * Verifies a PluginStateWriteRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginStateWriteRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginStateWriteRequest
         */
        public static fromObject(object: { [k: string]: any }): types.PluginStateWriteRequest;

        /**
         * Creates a plain object from a PluginStateWriteRequest message. Also converts values to other types if specified.
         * @param message PluginStateWriteRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginStateWriteRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginStateWriteRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginStateWriteRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginStateWriteResponse. */
    interface IPluginStateWriteResponse {

        /** PluginStateWriteResponse error */
        error?: (types.IPluginError|null);
    }

    /** Represents a PluginStateWriteResponse. */
    class PluginStateWriteResponse implements IPluginStateWriteResponse {

        /**
         * Constructs a new PluginStateWriteResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginStateWriteResponse);

        /** PluginStateWriteResponse error. */
        public error?: (types.IPluginError|null);

        /**
         * Creates a new PluginStateWriteResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginStateWriteResponse instance
         */
        public static create(properties?: types.IPluginStateWriteResponse): types.PluginStateWriteResponse;

        /**
         * Encodes the specified PluginStateWriteResponse message. Does not implicitly {@link types.PluginStateWriteResponse.verify|verify} messages.
         * @param message PluginStateWriteResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginStateWriteResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginStateWriteResponse message, length delimited. Does not implicitly {@link types.PluginStateWriteResponse.verify|verify} messages.
         * @param message PluginStateWriteResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginStateWriteResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginStateWriteResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginStateWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginStateWriteResponse;

        /**
         * Decodes a PluginStateWriteResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginStateWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginStateWriteResponse;

        /**
         * Verifies a PluginStateWriteResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginStateWriteResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginStateWriteResponse
         */
        public static fromObject(object: { [k: string]: any }): types.PluginStateWriteResponse;

        /**
         * Creates a plain object from a PluginStateWriteResponse message. Also converts values to other types if specified.
         * @param message PluginStateWriteResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginStateWriteResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginStateWriteResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginStateWriteResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginSetOp. */
    interface IPluginSetOp {

        /** PluginSetOp key */
        key?: (Uint8Array|null);

        /** PluginSetOp value */
        value?: (Uint8Array|null);
    }

    /** Represents a PluginSetOp. */
    class PluginSetOp implements IPluginSetOp {

        /**
         * Constructs a new PluginSetOp.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginSetOp);

        /** PluginSetOp key. */
        public key: Uint8Array;

        /** PluginSetOp value. */
        public value: Uint8Array;

        /**
         * Creates a new PluginSetOp instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginSetOp instance
         */
        public static create(properties?: types.IPluginSetOp): types.PluginSetOp;

        /**
         * Encodes the specified PluginSetOp message. Does not implicitly {@link types.PluginSetOp.verify|verify} messages.
         * @param message PluginSetOp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginSetOp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginSetOp message, length delimited. Does not implicitly {@link types.PluginSetOp.verify|verify} messages.
         * @param message PluginSetOp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginSetOp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginSetOp message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginSetOp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginSetOp;

        /**
         * Decodes a PluginSetOp message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginSetOp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginSetOp;

        /**
         * Verifies a PluginSetOp message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginSetOp message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginSetOp
         */
        public static fromObject(object: { [k: string]: any }): types.PluginSetOp;

        /**
         * Creates a plain object from a PluginSetOp message. Also converts values to other types if specified.
         * @param message PluginSetOp
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginSetOp, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginSetOp to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginSetOp
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginDeleteOp. */
    interface IPluginDeleteOp {

        /** PluginDeleteOp key */
        key?: (Uint8Array|null);
    }

    /** Represents a PluginDeleteOp. */
    class PluginDeleteOp implements IPluginDeleteOp {

        /**
         * Constructs a new PluginDeleteOp.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginDeleteOp);

        /** PluginDeleteOp key. */
        public key: Uint8Array;

        /**
         * Creates a new PluginDeleteOp instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginDeleteOp instance
         */
        public static create(properties?: types.IPluginDeleteOp): types.PluginDeleteOp;

        /**
         * Encodes the specified PluginDeleteOp message. Does not implicitly {@link types.PluginDeleteOp.verify|verify} messages.
         * @param message PluginDeleteOp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginDeleteOp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginDeleteOp message, length delimited. Does not implicitly {@link types.PluginDeleteOp.verify|verify} messages.
         * @param message PluginDeleteOp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginDeleteOp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginDeleteOp message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginDeleteOp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginDeleteOp;

        /**
         * Decodes a PluginDeleteOp message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginDeleteOp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginDeleteOp;

        /**
         * Verifies a PluginDeleteOp message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginDeleteOp message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginDeleteOp
         */
        public static fromObject(object: { [k: string]: any }): types.PluginDeleteOp;

        /**
         * Creates a plain object from a PluginDeleteOp message. Also converts values to other types if specified.
         * @param message PluginDeleteOp
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginDeleteOp, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginDeleteOp to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginDeleteOp
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PluginStateEntry. */
    interface IPluginStateEntry {

        /** PluginStateEntry key */
        key?: (Uint8Array|null);

        /** PluginStateEntry value */
        value?: (Uint8Array|null);
    }

    /** Represents a PluginStateEntry. */
    class PluginStateEntry implements IPluginStateEntry {

        /**
         * Constructs a new PluginStateEntry.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IPluginStateEntry);

        /** PluginStateEntry key. */
        public key: Uint8Array;

        /** PluginStateEntry value. */
        public value: Uint8Array;

        /**
         * Creates a new PluginStateEntry instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PluginStateEntry instance
         */
        public static create(properties?: types.IPluginStateEntry): types.PluginStateEntry;

        /**
         * Encodes the specified PluginStateEntry message. Does not implicitly {@link types.PluginStateEntry.verify|verify} messages.
         * @param message PluginStateEntry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IPluginStateEntry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PluginStateEntry message, length delimited. Does not implicitly {@link types.PluginStateEntry.verify|verify} messages.
         * @param message PluginStateEntry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IPluginStateEntry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PluginStateEntry message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PluginStateEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.PluginStateEntry;

        /**
         * Decodes a PluginStateEntry message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PluginStateEntry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.PluginStateEntry;

        /**
         * Verifies a PluginStateEntry message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PluginStateEntry message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PluginStateEntry
         */
        public static fromObject(object: { [k: string]: any }): types.PluginStateEntry;

        /**
         * Creates a plain object from a PluginStateEntry message. Also converts values to other types if specified.
         * @param message PluginStateEntry
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.PluginStateEntry, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PluginStateEntry to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PluginStateEntry
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Transaction. */
    interface ITransaction {

        /** Transaction messageType */
        messageType?: (string|null);

        /** Transaction msg */
        msg?: (google.protobuf.IAny|null);

        /** Transaction signature */
        signature?: (types.ISignature|null);

        /** Transaction createdHeight */
        createdHeight?: (number|Long|null);

        /** Transaction time */
        time?: (number|Long|null);

        /** Transaction fee */
        fee?: (number|Long|null);

        /** Transaction memo */
        memo?: (string|null);

        /** Transaction networkId */
        networkId?: (number|Long|null);

        /** Transaction chainId */
        chainId?: (number|Long|null);

        /** Transaction nonce */
        nonce?: (number|Long|null);
    }

    /** Represents a Transaction. */
    class Transaction implements ITransaction {

        /**
         * Constructs a new Transaction.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.ITransaction);

        /** Transaction messageType. */
        public messageType: string;

        /** Transaction msg. */
        public msg?: (google.protobuf.IAny|null);

        /** Transaction signature. */
        public signature?: (types.ISignature|null);

        /** Transaction createdHeight. */
        public createdHeight: (number|Long);

        /** Transaction time. */
        public time: (number|Long);

        /** Transaction fee. */
        public fee: (number|Long);

        /** Transaction memo. */
        public memo: string;

        /** Transaction networkId. */
        public networkId: (number|Long);

        /** Transaction chainId. */
        public chainId: (number|Long);

        /** Transaction nonce. */
        public nonce: (number|Long);

        /**
         * Creates a new Transaction instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Transaction instance
         */
        public static create(properties?: types.ITransaction): types.Transaction;

        /**
         * Encodes the specified Transaction message. Does not implicitly {@link types.Transaction.verify|verify} messages.
         * @param message Transaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Transaction message, length delimited. Does not implicitly {@link types.Transaction.verify|verify} messages.
         * @param message Transaction message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Transaction message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.Transaction;

        /**
         * Decodes a Transaction message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.Transaction;

        /**
         * Verifies a Transaction message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Transaction
         */
        public static fromObject(object: { [k: string]: any }): types.Transaction;

        /**
         * Creates a plain object from a Transaction message. Also converts values to other types if specified.
         * @param message Transaction
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.Transaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Transaction to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Transaction
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageSend. */
    interface IMessageSend {

        /** MessageSend fromAddress */
        fromAddress?: (Uint8Array|null);

        /** MessageSend toAddress */
        toAddress?: (Uint8Array|null);

        /** MessageSend amount */
        amount?: (number|Long|null);
    }

    /** Represents a MessageSend. */
    class MessageSend implements IMessageSend {

        /**
         * Constructs a new MessageSend.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageSend);

        /** MessageSend fromAddress. */
        public fromAddress: Uint8Array;

        /** MessageSend toAddress. */
        public toAddress: Uint8Array;

        /** MessageSend amount. */
        public amount: (number|Long);

        /**
         * Creates a new MessageSend instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageSend instance
         */
        public static create(properties?: types.IMessageSend): types.MessageSend;

        /**
         * Encodes the specified MessageSend message. Does not implicitly {@link types.MessageSend.verify|verify} messages.
         * @param message MessageSend message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageSend, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageSend message, length delimited. Does not implicitly {@link types.MessageSend.verify|verify} messages.
         * @param message MessageSend message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageSend, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageSend message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageSend
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageSend;

        /**
         * Decodes a MessageSend message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageSend
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageSend;

        /**
         * Verifies a MessageSend message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageSend message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageSend
         */
        public static fromObject(object: { [k: string]: any }): types.MessageSend;

        /**
         * Creates a plain object from a MessageSend message. Also converts values to other types if specified.
         * @param message MessageSend
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageSend, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageSend to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageSend
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a FeeParams. */
    interface IFeeParams {

        /** FeeParams sendFee */
        sendFee?: (number|Long|null);
    }

    /** Represents a FeeParams. */
    class FeeParams implements IFeeParams {

        /**
         * Constructs a new FeeParams.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IFeeParams);

        /** FeeParams sendFee. */
        public sendFee: (number|Long);

        /**
         * Creates a new FeeParams instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FeeParams instance
         */
        public static create(properties?: types.IFeeParams): types.FeeParams;

        /**
         * Encodes the specified FeeParams message. Does not implicitly {@link types.FeeParams.verify|verify} messages.
         * @param message FeeParams message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IFeeParams, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FeeParams message, length delimited. Does not implicitly {@link types.FeeParams.verify|verify} messages.
         * @param message FeeParams message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IFeeParams, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FeeParams message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FeeParams
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.FeeParams;

        /**
         * Decodes a FeeParams message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FeeParams
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.FeeParams;

        /**
         * Verifies a FeeParams message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FeeParams message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FeeParams
         */
        public static fromObject(object: { [k: string]: any }): types.FeeParams;

        /**
         * Creates a plain object from a FeeParams message. Also converts values to other types if specified.
         * @param message FeeParams
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.FeeParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FeeParams to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for FeeParams
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Signature. */
    interface ISignature {

        /** Signature publicKey */
        publicKey?: (Uint8Array|null);

        /** Signature signature */
        signature?: (Uint8Array|null);
    }

    /** Represents a Signature. */
    class Signature implements ISignature {

        /**
         * Constructs a new Signature.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.ISignature);

        /** Signature publicKey. */
        public publicKey: Uint8Array;

        /** Signature signature. */
        public signature: Uint8Array;

        /**
         * Creates a new Signature instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Signature instance
         */
        public static create(properties?: types.ISignature): types.Signature;

        /**
         * Encodes the specified Signature message. Does not implicitly {@link types.Signature.verify|verify} messages.
         * @param message Signature message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.ISignature, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Signature message, length delimited. Does not implicitly {@link types.Signature.verify|verify} messages.
         * @param message Signature message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.ISignature, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Signature message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Signature
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.Signature;

        /**
         * Decodes a Signature message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Signature
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.Signature;

        /**
         * Verifies a Signature message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Signature message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Signature
         */
        public static fromObject(object: { [k: string]: any }): types.Signature;

        /**
         * Creates a plain object from a Signature message. Also converts values to other types if specified.
         * @param message Signature
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.Signature, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Signature to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Signature
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageFaucetClaim. */
    interface IMessageFaucetClaim {

        /** MessageFaucetClaim address */
        address?: (Uint8Array|null);
    }

    /** Represents a MessageFaucetClaim. */
    class MessageFaucetClaim implements IMessageFaucetClaim {

        /**
         * Constructs a new MessageFaucetClaim.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageFaucetClaim);

        /** MessageFaucetClaim address. */
        public address: Uint8Array;

        /**
         * Creates a new MessageFaucetClaim instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageFaucetClaim instance
         */
        public static create(properties?: types.IMessageFaucetClaim): types.MessageFaucetClaim;

        /**
         * Encodes the specified MessageFaucetClaim message. Does not implicitly {@link types.MessageFaucetClaim.verify|verify} messages.
         * @param message MessageFaucetClaim message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageFaucetClaim, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageFaucetClaim message, length delimited. Does not implicitly {@link types.MessageFaucetClaim.verify|verify} messages.
         * @param message MessageFaucetClaim message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageFaucetClaim, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageFaucetClaim message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageFaucetClaim
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageFaucetClaim;

        /**
         * Decodes a MessageFaucetClaim message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageFaucetClaim
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageFaucetClaim;

        /**
         * Verifies a MessageFaucetClaim message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageFaucetClaim message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageFaucetClaim
         */
        public static fromObject(object: { [k: string]: any }): types.MessageFaucetClaim;

        /**
         * Creates a plain object from a MessageFaucetClaim message. Also converts values to other types if specified.
         * @param message MessageFaucetClaim
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageFaucetClaim, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageFaucetClaim to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageFaucetClaim
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageSetParams. */
    interface IMessageSetParams {

        /** MessageSetParams address */
        address?: (Uint8Array|null);

        /** MessageSetParams paramsJson */
        paramsJson?: (string|null);
    }

    /** Represents a MessageSetParams. */
    class MessageSetParams implements IMessageSetParams {

        /**
         * Constructs a new MessageSetParams.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageSetParams);

        /** MessageSetParams address. */
        public address: Uint8Array;

        /** MessageSetParams paramsJson. */
        public paramsJson: string;

        /**
         * Creates a new MessageSetParams instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageSetParams instance
         */
        public static create(properties?: types.IMessageSetParams): types.MessageSetParams;

        /**
         * Encodes the specified MessageSetParams message. Does not implicitly {@link types.MessageSetParams.verify|verify} messages.
         * @param message MessageSetParams message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageSetParams, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageSetParams message, length delimited. Does not implicitly {@link types.MessageSetParams.verify|verify} messages.
         * @param message MessageSetParams message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageSetParams, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageSetParams message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageSetParams
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageSetParams;

        /**
         * Decodes a MessageSetParams message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageSetParams
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageSetParams;

        /**
         * Verifies a MessageSetParams message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageSetParams message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageSetParams
         */
        public static fromObject(object: { [k: string]: any }): types.MessageSetParams;

        /**
         * Creates a plain object from a MessageSetParams message. Also converts values to other types if specified.
         * @param message MessageSetParams
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageSetParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageSetParams to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageSetParams
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageCreateCharacter. */
    interface IMessageCreateCharacter {

        /** MessageCreateCharacter address */
        address?: (Uint8Array|null);

        /** MessageCreateCharacter name */
        name?: (string|null);

        /** MessageCreateCharacter classId */
        classId?: (string|null);

        /** MessageCreateCharacter commit */
        commit?: (Uint8Array|null);
    }

    /** Represents a MessageCreateCharacter. */
    class MessageCreateCharacter implements IMessageCreateCharacter {

        /**
         * Constructs a new MessageCreateCharacter.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageCreateCharacter);

        /** MessageCreateCharacter address. */
        public address: Uint8Array;

        /** MessageCreateCharacter name. */
        public name: string;

        /** MessageCreateCharacter classId. */
        public classId: string;

        /** MessageCreateCharacter commit. */
        public commit: Uint8Array;

        /**
         * Creates a new MessageCreateCharacter instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageCreateCharacter instance
         */
        public static create(properties?: types.IMessageCreateCharacter): types.MessageCreateCharacter;

        /**
         * Encodes the specified MessageCreateCharacter message. Does not implicitly {@link types.MessageCreateCharacter.verify|verify} messages.
         * @param message MessageCreateCharacter message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageCreateCharacter, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageCreateCharacter message, length delimited. Does not implicitly {@link types.MessageCreateCharacter.verify|verify} messages.
         * @param message MessageCreateCharacter message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageCreateCharacter, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageCreateCharacter message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageCreateCharacter
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageCreateCharacter;

        /**
         * Decodes a MessageCreateCharacter message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageCreateCharacter
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageCreateCharacter;

        /**
         * Verifies a MessageCreateCharacter message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageCreateCharacter message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageCreateCharacter
         */
        public static fromObject(object: { [k: string]: any }): types.MessageCreateCharacter;

        /**
         * Creates a plain object from a MessageCreateCharacter message. Also converts values to other types if specified.
         * @param message MessageCreateCharacter
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageCreateCharacter, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageCreateCharacter to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageCreateCharacter
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageAssignStats. */
    interface IMessageAssignStats {

        /** MessageAssignStats address */
        address?: (Uint8Array|null);

        /** MessageAssignStats charId */
        charId?: (Uint8Array|null);

        /** MessageAssignStats permutation */
        permutation?: (number[]|null);
    }

    /** Represents a MessageAssignStats. */
    class MessageAssignStats implements IMessageAssignStats {

        /**
         * Constructs a new MessageAssignStats.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageAssignStats);

        /** MessageAssignStats address. */
        public address: Uint8Array;

        /** MessageAssignStats charId. */
        public charId: Uint8Array;

        /** MessageAssignStats permutation. */
        public permutation: number[];

        /**
         * Creates a new MessageAssignStats instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageAssignStats instance
         */
        public static create(properties?: types.IMessageAssignStats): types.MessageAssignStats;

        /**
         * Encodes the specified MessageAssignStats message. Does not implicitly {@link types.MessageAssignStats.verify|verify} messages.
         * @param message MessageAssignStats message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageAssignStats, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageAssignStats message, length delimited. Does not implicitly {@link types.MessageAssignStats.verify|verify} messages.
         * @param message MessageAssignStats message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageAssignStats, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageAssignStats message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageAssignStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageAssignStats;

        /**
         * Decodes a MessageAssignStats message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageAssignStats
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageAssignStats;

        /**
         * Verifies a MessageAssignStats message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageAssignStats message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageAssignStats
         */
        public static fromObject(object: { [k: string]: any }): types.MessageAssignStats;

        /**
         * Creates a plain object from a MessageAssignStats message. Also converts values to other types if specified.
         * @param message MessageAssignStats
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageAssignStats, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageAssignStats to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageAssignStats
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageEnterDungeon. */
    interface IMessageEnterDungeon {

        /** MessageEnterDungeon address */
        address?: (Uint8Array|null);

        /** MessageEnterDungeon charId */
        charId?: (Uint8Array|null);
    }

    /** Represents a MessageEnterDungeon. */
    class MessageEnterDungeon implements IMessageEnterDungeon {

        /**
         * Constructs a new MessageEnterDungeon.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageEnterDungeon);

        /** MessageEnterDungeon address. */
        public address: Uint8Array;

        /** MessageEnterDungeon charId. */
        public charId: Uint8Array;

        /**
         * Creates a new MessageEnterDungeon instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageEnterDungeon instance
         */
        public static create(properties?: types.IMessageEnterDungeon): types.MessageEnterDungeon;

        /**
         * Encodes the specified MessageEnterDungeon message. Does not implicitly {@link types.MessageEnterDungeon.verify|verify} messages.
         * @param message MessageEnterDungeon message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageEnterDungeon, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageEnterDungeon message, length delimited. Does not implicitly {@link types.MessageEnterDungeon.verify|verify} messages.
         * @param message MessageEnterDungeon message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageEnterDungeon, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageEnterDungeon message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageEnterDungeon
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageEnterDungeon;

        /**
         * Decodes a MessageEnterDungeon message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageEnterDungeon
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageEnterDungeon;

        /**
         * Verifies a MessageEnterDungeon message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageEnterDungeon message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageEnterDungeon
         */
        public static fromObject(object: { [k: string]: any }): types.MessageEnterDungeon;

        /**
         * Creates a plain object from a MessageEnterDungeon message. Also converts values to other types if specified.
         * @param message MessageEnterDungeon
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageEnterDungeon, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageEnterDungeon to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageEnterDungeon
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageAct. */
    interface IMessageAct {

        /** MessageAct address */
        address?: (Uint8Array|null);

        /** MessageAct charId */
        charId?: (Uint8Array|null);

        /** MessageAct kind */
        kind?: (string|null);

        /** MessageAct actionId */
        actionId?: (string|null);

        /** MessageAct target */
        target?: (string|null);

        /** MessageAct itemId */
        itemId?: (string|null);

        /** MessageAct ability */
        ability?: (string|null);

        /** MessageAct toLevel */
        toLevel?: (number|null);

        /** MessageAct toRoom */
        toRoom?: (number|null);

        /** MessageAct lootRef */
        lootRef?: (string|null);

        /** MessageAct commit */
        commit?: (Uint8Array|null);
    }

    /** Represents a MessageAct. */
    class MessageAct implements IMessageAct {

        /**
         * Constructs a new MessageAct.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageAct);

        /** MessageAct address. */
        public address: Uint8Array;

        /** MessageAct charId. */
        public charId: Uint8Array;

        /** MessageAct kind. */
        public kind: string;

        /** MessageAct actionId. */
        public actionId: string;

        /** MessageAct target. */
        public target: string;

        /** MessageAct itemId. */
        public itemId: string;

        /** MessageAct ability. */
        public ability: string;

        /** MessageAct toLevel. */
        public toLevel: number;

        /** MessageAct toRoom. */
        public toRoom: number;

        /** MessageAct lootRef. */
        public lootRef: string;

        /** MessageAct commit. */
        public commit: Uint8Array;

        /**
         * Creates a new MessageAct instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageAct instance
         */
        public static create(properties?: types.IMessageAct): types.MessageAct;

        /**
         * Encodes the specified MessageAct message. Does not implicitly {@link types.MessageAct.verify|verify} messages.
         * @param message MessageAct message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageAct, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageAct message, length delimited. Does not implicitly {@link types.MessageAct.verify|verify} messages.
         * @param message MessageAct message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageAct, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageAct message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageAct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageAct;

        /**
         * Decodes a MessageAct message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageAct
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageAct;

        /**
         * Verifies a MessageAct message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageAct message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageAct
         */
        public static fromObject(object: { [k: string]: any }): types.MessageAct;

        /**
         * Creates a plain object from a MessageAct message. Also converts values to other types if specified.
         * @param message MessageAct
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageAct, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageAct to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageAct
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageReveal. */
    interface IMessageReveal {

        /** MessageReveal address */
        address?: (Uint8Array|null);

        /** MessageReveal rollId */
        rollId?: (Uint8Array|null);

        /** MessageReveal secret */
        secret?: (Uint8Array|null);
    }

    /** Represents a MessageReveal. */
    class MessageReveal implements IMessageReveal {

        /**
         * Constructs a new MessageReveal.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageReveal);

        /** MessageReveal address. */
        public address: Uint8Array;

        /** MessageReveal rollId. */
        public rollId: Uint8Array;

        /** MessageReveal secret. */
        public secret: Uint8Array;

        /**
         * Creates a new MessageReveal instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageReveal instance
         */
        public static create(properties?: types.IMessageReveal): types.MessageReveal;

        /**
         * Encodes the specified MessageReveal message. Does not implicitly {@link types.MessageReveal.verify|verify} messages.
         * @param message MessageReveal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageReveal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageReveal message, length delimited. Does not implicitly {@link types.MessageReveal.verify|verify} messages.
         * @param message MessageReveal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageReveal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageReveal message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageReveal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageReveal;

        /**
         * Decodes a MessageReveal message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageReveal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageReveal;

        /**
         * Verifies a MessageReveal message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageReveal message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageReveal
         */
        public static fromObject(object: { [k: string]: any }): types.MessageReveal;

        /**
         * Creates a plain object from a MessageReveal message. Also converts values to other types if specified.
         * @param message MessageReveal
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageReveal, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageReveal to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageReveal
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageGive. */
    interface IMessageGive {

        /** MessageGive address */
        address?: (Uint8Array|null);

        /** MessageGive charId */
        charId?: (Uint8Array|null);

        /** MessageGive toCharId */
        toCharId?: (Uint8Array|null);

        /** MessageGive itemId */
        itemId?: (string|null);

        /** MessageGive gold */
        gold?: (number|Long|null);
    }

    /** Represents a MessageGive. */
    class MessageGive implements IMessageGive {

        /**
         * Constructs a new MessageGive.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageGive);

        /** MessageGive address. */
        public address: Uint8Array;

        /** MessageGive charId. */
        public charId: Uint8Array;

        /** MessageGive toCharId. */
        public toCharId: Uint8Array;

        /** MessageGive itemId. */
        public itemId: string;

        /** MessageGive gold. */
        public gold: (number|Long);

        /**
         * Creates a new MessageGive instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageGive instance
         */
        public static create(properties?: types.IMessageGive): types.MessageGive;

        /**
         * Encodes the specified MessageGive message. Does not implicitly {@link types.MessageGive.verify|verify} messages.
         * @param message MessageGive message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageGive, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageGive message, length delimited. Does not implicitly {@link types.MessageGive.verify|verify} messages.
         * @param message MessageGive message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageGive, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageGive message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageGive
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageGive;

        /**
         * Decodes a MessageGive message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageGive
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageGive;

        /**
         * Verifies a MessageGive message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageGive message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageGive
         */
        public static fromObject(object: { [k: string]: any }): types.MessageGive;

        /**
         * Creates a plain object from a MessageGive message. Also converts values to other types if specified.
         * @param message MessageGive
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageGive, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageGive to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageGive
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageExtract. */
    interface IMessageExtract {

        /** MessageExtract address */
        address?: (Uint8Array|null);

        /** MessageExtract charId */
        charId?: (Uint8Array|null);
    }

    /** Represents a MessageExtract. */
    class MessageExtract implements IMessageExtract {

        /**
         * Constructs a new MessageExtract.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageExtract);

        /** MessageExtract address. */
        public address: Uint8Array;

        /** MessageExtract charId. */
        public charId: Uint8Array;

        /**
         * Creates a new MessageExtract instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageExtract instance
         */
        public static create(properties?: types.IMessageExtract): types.MessageExtract;

        /**
         * Encodes the specified MessageExtract message. Does not implicitly {@link types.MessageExtract.verify|verify} messages.
         * @param message MessageExtract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageExtract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageExtract message, length delimited. Does not implicitly {@link types.MessageExtract.verify|verify} messages.
         * @param message MessageExtract message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageExtract, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageExtract message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageExtract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageExtract;

        /**
         * Decodes a MessageExtract message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageExtract
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageExtract;

        /**
         * Verifies a MessageExtract message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageExtract message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageExtract
         */
        public static fromObject(object: { [k: string]: any }): types.MessageExtract;

        /**
         * Creates a plain object from a MessageExtract message. Also converts values to other types if specified.
         * @param message MessageExtract
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageExtract, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageExtract to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageExtract
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageShopBuy. */
    interface IMessageShopBuy {

        /** MessageShopBuy address */
        address?: (Uint8Array|null);

        /** MessageShopBuy charId */
        charId?: (Uint8Array|null);

        /** MessageShopBuy template */
        template?: (string|null);

        /** MessageShopBuy qty */
        qty?: (number|null);
    }

    /** Represents a MessageShopBuy. */
    class MessageShopBuy implements IMessageShopBuy {

        /**
         * Constructs a new MessageShopBuy.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageShopBuy);

        /** MessageShopBuy address. */
        public address: Uint8Array;

        /** MessageShopBuy charId. */
        public charId: Uint8Array;

        /** MessageShopBuy template. */
        public template: string;

        /** MessageShopBuy qty. */
        public qty: number;

        /**
         * Creates a new MessageShopBuy instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageShopBuy instance
         */
        public static create(properties?: types.IMessageShopBuy): types.MessageShopBuy;

        /**
         * Encodes the specified MessageShopBuy message. Does not implicitly {@link types.MessageShopBuy.verify|verify} messages.
         * @param message MessageShopBuy message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageShopBuy, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageShopBuy message, length delimited. Does not implicitly {@link types.MessageShopBuy.verify|verify} messages.
         * @param message MessageShopBuy message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageShopBuy, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageShopBuy message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageShopBuy
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageShopBuy;

        /**
         * Decodes a MessageShopBuy message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageShopBuy
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageShopBuy;

        /**
         * Verifies a MessageShopBuy message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageShopBuy message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageShopBuy
         */
        public static fromObject(object: { [k: string]: any }): types.MessageShopBuy;

        /**
         * Creates a plain object from a MessageShopBuy message. Also converts values to other types if specified.
         * @param message MessageShopBuy
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageShopBuy, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageShopBuy to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageShopBuy
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageShopSell. */
    interface IMessageShopSell {

        /** MessageShopSell address */
        address?: (Uint8Array|null);

        /** MessageShopSell charId */
        charId?: (Uint8Array|null);

        /** MessageShopSell itemId */
        itemId?: (string|null);
    }

    /** Represents a MessageShopSell. */
    class MessageShopSell implements IMessageShopSell {

        /**
         * Constructs a new MessageShopSell.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageShopSell);

        /** MessageShopSell address. */
        public address: Uint8Array;

        /** MessageShopSell charId. */
        public charId: Uint8Array;

        /** MessageShopSell itemId. */
        public itemId: string;

        /**
         * Creates a new MessageShopSell instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageShopSell instance
         */
        public static create(properties?: types.IMessageShopSell): types.MessageShopSell;

        /**
         * Encodes the specified MessageShopSell message. Does not implicitly {@link types.MessageShopSell.verify|verify} messages.
         * @param message MessageShopSell message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageShopSell, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageShopSell message, length delimited. Does not implicitly {@link types.MessageShopSell.verify|verify} messages.
         * @param message MessageShopSell message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageShopSell, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageShopSell message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageShopSell
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageShopSell;

        /**
         * Decodes a MessageShopSell message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageShopSell
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageShopSell;

        /**
         * Verifies a MessageShopSell message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageShopSell message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageShopSell
         */
        public static fromObject(object: { [k: string]: any }): types.MessageShopSell;

        /**
         * Creates a plain object from a MessageShopSell message. Also converts values to other types if specified.
         * @param message MessageShopSell
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageShopSell, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageShopSell to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageShopSell
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessageStashMove. */
    interface IMessageStashMove {

        /** MessageStashMove address */
        address?: (Uint8Array|null);

        /** MessageStashMove charId */
        charId?: (Uint8Array|null);

        /** MessageStashMove itemId */
        itemId?: (string|null);

        /** MessageStashMove toStash */
        toStash?: (boolean|null);
    }

    /** Represents a MessageStashMove. */
    class MessageStashMove implements IMessageStashMove {

        /**
         * Constructs a new MessageStashMove.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessageStashMove);

        /** MessageStashMove address. */
        public address: Uint8Array;

        /** MessageStashMove charId. */
        public charId: Uint8Array;

        /** MessageStashMove itemId. */
        public itemId: string;

        /** MessageStashMove toStash. */
        public toStash: boolean;

        /**
         * Creates a new MessageStashMove instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessageStashMove instance
         */
        public static create(properties?: types.IMessageStashMove): types.MessageStashMove;

        /**
         * Encodes the specified MessageStashMove message. Does not implicitly {@link types.MessageStashMove.verify|verify} messages.
         * @param message MessageStashMove message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessageStashMove, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessageStashMove message, length delimited. Does not implicitly {@link types.MessageStashMove.verify|verify} messages.
         * @param message MessageStashMove message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessageStashMove, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessageStashMove message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessageStashMove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessageStashMove;

        /**
         * Decodes a MessageStashMove message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessageStashMove
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessageStashMove;

        /**
         * Verifies a MessageStashMove message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessageStashMove message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessageStashMove
         */
        public static fromObject(object: { [k: string]: any }): types.MessageStashMove;

        /**
         * Creates a plain object from a MessageStashMove message. Also converts values to other types if specified.
         * @param message MessageStashMove
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessageStashMove, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessageStashMove to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessageStashMove
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MessagePartySet. */
    interface IMessagePartySet {

        /** MessagePartySet address */
        address?: (Uint8Array|null);

        /** MessagePartySet charId */
        charId?: (Uint8Array|null);

        /** MessagePartySet with */
        "with"?: (Uint8Array|null);
    }

    /** Represents a MessagePartySet. */
    class MessagePartySet implements IMessagePartySet {

        /**
         * Constructs a new MessagePartySet.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IMessagePartySet);

        /** MessagePartySet address. */
        public address: Uint8Array;

        /** MessagePartySet charId. */
        public charId: Uint8Array;

        /** MessagePartySet with. */
        public with: Uint8Array;

        /**
         * Creates a new MessagePartySet instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MessagePartySet instance
         */
        public static create(properties?: types.IMessagePartySet): types.MessagePartySet;

        /**
         * Encodes the specified MessagePartySet message. Does not implicitly {@link types.MessagePartySet.verify|verify} messages.
         * @param message MessagePartySet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IMessagePartySet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MessagePartySet message, length delimited. Does not implicitly {@link types.MessagePartySet.verify|verify} messages.
         * @param message MessagePartySet message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IMessagePartySet, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MessagePartySet message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MessagePartySet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.MessagePartySet;

        /**
         * Decodes a MessagePartySet message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MessagePartySet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.MessagePartySet;

        /**
         * Verifies a MessagePartySet message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MessagePartySet message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MessagePartySet
         */
        public static fromObject(object: { [k: string]: any }): types.MessagePartySet;

        /**
         * Creates a plain object from a MessagePartySet message. Also converts values to other types if specified.
         * @param message MessagePartySet
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.MessagePartySet, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MessagePartySet to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MessagePartySet
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an AbbeyEvent. */
    interface IAbbeyEvent {

        /** AbbeyEvent kind */
        kind?: (string|null);

        /** AbbeyEvent data */
        data?: (string|null);
    }

    /** Represents an AbbeyEvent. */
    class AbbeyEvent implements IAbbeyEvent {

        /**
         * Constructs a new AbbeyEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: types.IAbbeyEvent);

        /** AbbeyEvent kind. */
        public kind: string;

        /** AbbeyEvent data. */
        public data: string;

        /**
         * Creates a new AbbeyEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AbbeyEvent instance
         */
        public static create(properties?: types.IAbbeyEvent): types.AbbeyEvent;

        /**
         * Encodes the specified AbbeyEvent message. Does not implicitly {@link types.AbbeyEvent.verify|verify} messages.
         * @param message AbbeyEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: types.IAbbeyEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AbbeyEvent message, length delimited. Does not implicitly {@link types.AbbeyEvent.verify|verify} messages.
         * @param message AbbeyEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: types.IAbbeyEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AbbeyEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AbbeyEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): types.AbbeyEvent;

        /**
         * Decodes an AbbeyEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AbbeyEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): types.AbbeyEvent;

        /**
         * Verifies an AbbeyEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AbbeyEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AbbeyEvent
         */
        public static fromObject(object: { [k: string]: any }): types.AbbeyEvent;

        /**
         * Creates a plain object from an AbbeyEvent message. Also converts values to other types if specified.
         * @param message AbbeyEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: types.AbbeyEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AbbeyEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for AbbeyEvent
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of an Any. */
        interface IAny {

            /** Any type_url */
            type_url?: (string|null);

            /** Any value */
            value?: (Uint8Array|null);
        }

        /** Represents an Any. */
        class Any implements IAny {

            /**
             * Constructs a new Any.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IAny);

            /** Any type_url. */
            public type_url: string;

            /** Any value. */
            public value: Uint8Array;

            /**
             * Creates a new Any instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Any instance
             */
            public static create(properties?: google.protobuf.IAny): google.protobuf.Any;

            /**
             * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Any message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

            /**
             * Verifies an Any message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Any message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Any
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

            /**
             * Creates a plain object from an Any message. Also converts values to other types if specified.
             * @param message Any
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Any to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Any
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
