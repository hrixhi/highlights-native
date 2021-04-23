export const defaultSleepInfo = () => {

    const from = new Date()
    from.setHours(23, 0, 0)

    const to = new Date()
    to.setHours(7, 0, 0)

    return {
        from,
        to
    }

}

export const defaultRandomShuffleFrequency = "6-H"

export const defaultCues = [
    // Routine cues
    {
        "_id": 0,
        "cue": "<div>Stay Hydrated.</div><div>Drink water!</div>",
        "date": new Date(),
        "shuffle": false,
        "frequency": "3-H",
        "customCategory": "Routine",
        "color": 0,
        "starred": false,
        "endPlayAt": ""
    },
    {
        "_id": 1,
        "cue": "<div>Work Out.</div><div>Weekly weigh-ins.</div><div><br/><br/>Week 1 - 185lbs<br/><br/>Week 2 - 183lbs<br/><br/>Week 3 - 180lbs</div>",
        "date": new Date(),
        "shuffle": false,
        "frequency": "1-D",
        "customCategory": "Routine",
        "color": 2,
        "starred": false,
        "endPlayAt": ""
    },
    // Ideas cues
    {
        "_id": 2,
        "cue": "<div>\"Time is your most valuable resource.\"</div><div>Use it wisely.</div>",
        "date": new Date(),
        "shuffle": true,
        "frequency": "1-D",
        "customCategory": "Ideas",
        "color": 1,
        "starred": false,
        "endPlayAt": ""
    },
    // To Do cues
    {
        "_id": 3,
        "cue": "<div>Team Project Tasks.</div><div>Due Feb 25.</div><div><br></div><div><ul><li>Introduction</li><li>Problems</li><li>Past solutions</li><li>New solutions</li></ul></div>",
        "date": new Date(),
        "shuffle": false,
        "frequency": "1-D",
        "customCategory": "To Do",
        "color": 4,
        "starred": true,
        "endPlayAt": ""
    }
]