/**
 * Define constants for the project
 *
 */


/**
 * Define log contants and colors
 * ERROR: red
 * INFO: blue
 * NODE: green
 * DIRECTOR: yellow
 * COORDINATOR: magenta
 * SCHEDULED TASK: cyan
 * ELECTION: yellow bg, black text
 *
 */
const log = {
    ERROR: "\x1b[31m[ERROR]\x1b[0m",
    INFO: "\x1b[34m[INFO]\x1b[0m",
    NODE: "\x1b[32m[NODE]\x1b[0m",
    DIRECTOR: "\x1b[33m[DIRECTOR]\x1b[0m",
    COORDINATOR: "\x1b[35m[COORDINATOR]\x1b[0m",
    SCHEDULED_TASK: "\x1b[36m[SCHEDULED TASK]\x1b[0m",
    ELECTION: "\x1b[43m\x1b[30m[ELECTION]\x1b[0m"
}




module.exports = {
    log
};