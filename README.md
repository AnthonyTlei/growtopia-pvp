# TODO

### Match enhancements

[X] Track creator of a match (for banning purposes)

### ELO

[X] Create ELO algorithm

[X] Set elo on User db

[X] On match Completed, update ELO

[X] Add ELO changes (up/down) next to participant names (color coded)

### Safeguards and Actions

[X] a pending/in_progress match can be edited/deleted by the creator, but not a completed one (admin only) (UI)

[X] a match cannot be created if the participants have a pending OR an in_progress matches on-going (for elo calculations)

[X] Remove IN PROGRESS state

[X] Edit match if creator & not completed OR if admin

[X] Delete match if creator & not completed OR if admin

[X] Handle ELO reverting and updating of PENDING matches of affected players

[X] How to handle if the deleted match has COMPLETED successors?

[X] Cancel match (if PENDING and creator)

### Reports + context menu introduction

[X] Create Report model

[X] Add CRUD for Reports

[X] Report action

[X] Report page (role based)

### Admin features

[ ] Add users page

[ ] Ban users (Perma = deletes all the user's matches + elo resets for ev1)

### Rankings

[ ] Create a chessbase style like table of rankings with latest elo changes

### Comments

[ ] Add "Open comments" under each match

[ ] Pops in (instagram style)

[ ] Paginated + infinite load comments

### Annoucements

[ ] Add annoucements db table

[ ] Add annoucements page

[ ] Provide admins a way to create/edit/delete annoucements

### Home page

[ ] Recent annoucements

[ ] Recent matches

[ ] Recent ELO changes

### Socials

[ ] Profile pages for players

[ ] Sharing profiles/matches to socials

### Guilds

[ ] Allow admins to create/edit/delete guilds

[ ] Allow players to join a guild (shows on their profiles)
