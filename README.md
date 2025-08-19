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
[ ] Edit match if creator & not completed OR if admin
[ ] Cancel match if creator & not completed OR if admin
[ ] Delete match if admin
[ ] Share Match

### Reports + context menu introduction

[ ] Create Report model

[ ] Add CRUD for Reports

[ ] Report action

### Admin features

[ ] Add admin page

[ ] View reports

[ ] Add Delete/Edit context options on matches

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
