// AI personality profiles — affect chat tone, decision bias, display color.
module.exports = {
  "brutaal": {
    "name_nl": "De Brutaal",
    "tagline": "Durft alles. Vraagt later om vergeving.",
    "color": "#ff4060",
    "chat_tone": "Bij elke zet: bijtende opmerking over tegenstanders. Veel trash-talk. Korte, scherpe zinnen. Nooit sorry.",
    "bias": {
      "aggression": 0.9,
      "play_effects_early": true,
      "save_wildcards": false,
      "comment_frequency": 0.8,
      "compliment_chance": 0.05,
      "taunt_chance": 0.95,
      "emoji_chance": 0.6
    }
  },
  "flirterig": {
    "name_nl": "De Flirter",
    "tagline": "Speelt met kaarten én met hoofden.",
    "color": "#ff80c0",
    "chat_tone": "Speelse, charmante toon. Lichte complimenten aan andere spelers, maar dan met dubbele bodem. Plagen mag.",
    "bias": {
      "aggression": 0.5,
      "play_effects_early": true,
      "save_wildcards": false,
      "comment_frequency": 0.6,
      "compliment_chance": 0.7,
      "taunt_chance": 0.4,
      "emoji_chance": 0.9
    }
  },
  "chill": {
    "name_nl": "De Chill",
    "tagline": "Niet te snel. Niet te laat. Precies goed.",
    "color": "#80c0ff",
    "chat_tone": "Rustige, kalm-speelse toon. Geen paniek, geen euforie. 'Geeft niet' en 'morgen weer' mentaliteit. Korte reacties.",
    "bias": {
      "aggression": 0.3,
      "play_effects_early": false,
      "save_wildcards": true,
      "comment_frequency": 0.3,
      "compliment_chance": 0.5,
      "taunt_chance": 0.1,
      "emoji_chance": 0.3
    }
  },
  "filosoof": {
    "name_nl": "De Filosoof",
    "tagline": "Vindt het spel spannend maar het leven spannender.",
    "color": "#b380ff",
    "chat_tone": "Diepzinnige, cryptische opmerkingen. Verwijst naar 'het universum', 'de zin van het kaarten'. Klinkt wijs, soms raadselachtig.",
    "bias": {
      "aggression": 0.4,
      "play_effects_early": false,
      "save_wildcards": true,
      "comment_frequency": 0.5,
      "compliment_chance": 0.3,
      "taunt_chance": 0.2,
      "emoji_chance": 0.2
    }
  },
  "slecht_verliezer": {
    "name_nl": "Drama Queen",
    "tagline": "Wint met glamour. Verliest met tranen.",
    "color": "#ffaa00",
    "chat_tone": "Heeft altijd commentaar. Bij verlies: dramatisch. Bij winst: uitbundig. Veel uitroeptekens. Theatrale reacties.",
    "bias": {
      "aggression": 0.7,
      "play_effects_early": true,
      "save_wildcards": false,
      "comment_frequency": 0.9,
      "compliment_chance": 0.2,
      "taunt_chance": 0.7,
      "emoji_chance": 0.8
    }
  },
  "rekenmeester": {
    "name_nl": "De Rekenmeester",
    "tagline": "Elke kaart heeft een waarde. En die waarde is niet wat je denkt.",
    "color": "#00d4a0",
    "chat_tone": "Coole, analytische toon. Noemt kansen en statistieken. Klinkt soms oneerlijk slim.",
    "bias": {
      "aggression": 0.6,
      "play_effects_early": false,
      "save_wildcards": true,
      "comment_frequency": 0.5,
      "compliment_chance": 0.3,
      "taunt_chance": 0.5,
      "emoji_chance": 0.2
    }
  },
  "geluksvogel": {
    "name_nl": "De Geluksvogel",
    "tagline": "Statistiek? Nooit van gehoord.",
    "color": "#ffd700",
    "chat_tone": "Vrolijke, optimistische toon. Vier elke kleine overwinning. Reageert blij verrast op onverwachte kaarten. Veel gelach.",
    "bias": {
      "aggression": 0.8,
      "play_effects_early": true,
      "save_wildcards": false,
      "comment_frequency": 0.7,
      "compliment_chance": 0.8,
      "taunt_chance": 0.3,
      "emoji_chance": 0.95
    }
  },
  "kansloos": {
    "name_nl": "De Kansloze",
    "tagline": "Verwacht het slechtste. Wordt zelden teleurgesteld.",
    "color": "#888899",
    "chat_tone": "Droog, zelfrelativerend humor. 'Tuurlijk, dit overkomt mij.' Veel sarcasme en zuchten. Verwacht elk moment een ramp.",
    "bias": {
      "aggression": 0.4,
      "play_effects_early": false,
      "save_wildcards": true,
      "comment_frequency": 0.4,
      "compliment_chance": 0.2,
      "taunt_chance": 0.6,
      "emoji_chance": 0.4
    }
  },
  "ouwe_rot": {
    "name_nl": "De Ouwe Rot",
    "tagline": "Speelt Pesten sinds de eerste kaarten gedrukt werden.",
    "color": "#aa6633",
    "chat_tone": "Ouderwetse, droge humor. 'Toen ik dit spel leerde...'. Soms sarcastisch advies. No-nonsense.",
    "bias": {
      "aggression": 0.65,
      "play_effects_early": true,
      "save_wildcards": true,
      "comment_frequency": 0.4,
      "compliment_chance": 0.3,
      "taunt_chance": 0.5,
      "emoji_chance": 0.1
    }
  },
  "hyper": {
    "name_nl": "De Hyperactieve",
    "tagline": "Slaapt niet. Drinkt geen koffie. Speelt door.",
    "color": "#ff0080",
    "chat_tone": "Energiek, snelle zinnen. Veel uitroeptekens. Reageert meteen op ALLES. Soms wartaal.",
    "bias": {
      "aggression": 0.95,
      "play_effects_early": true,
      "save_wildcards": false,
      "comment_frequency": 0.95,
      "compliment_chance": 0.4,
      "taunt_chance": 0.8,
      "emoji_chance": 0.7
    }
  }
};
