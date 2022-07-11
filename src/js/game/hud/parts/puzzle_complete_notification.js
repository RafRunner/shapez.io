/* typehints:start */
import { PuzzlePlayGameMode } from "../../modes/puzzle_play";
/* typehints:end */

import { InputReceiver } from "../../../core/input_receiver";
import { makeDiv } from "../../../core/utils";
import { SOUNDS } from "../../../platform/sound";
import { T } from "../../../translations";
import { BaseHUDPart } from "../base_hud_part";
import { DynamicDomAttach } from "../dynamic_dom_attach";

const difficultyLabels = ["easy", "medium", "hard"];

export class HUDPuzzleCompleteNotification extends BaseHUDPart {
    initialize() {
        this.visible = false;

        this.domAttach = new DynamicDomAttach(this.root, this.element, {
            timeToKeepSeconds: 0,
        });

        this.root.signals.puzzleComplete.add(this.show, this);
        this.userDidLikePuzzle = false;
        this.userRatedDifficulty = null;
        this.timeOfCompletion = 0;
    }

    createElements(parent) {
        this.inputReciever = new InputReceiver("puzzle-complete");

        this.element = makeDiv(parent, "ingame_HUD_PuzzleCompleteNotification", ["noBlur"]);

        const dialog = makeDiv(this.element, null, ["dialog"]);

        this.elemTitle = makeDiv(dialog, null, ["title"], T.ingame.puzzleCompletion.title);
        this.elemContents = makeDiv(dialog, null, ["contents"]);
        this.elemActions = makeDiv(dialog, null, ["actions"]);

        const stepLike = makeDiv(this.elemContents, null, ["step", "stepLike"]);
        makeDiv(stepLike, null, ["title"], T.ingame.puzzleCompletion.titleLike);

        const likeButtons = makeDiv(stepLike, null, ["buttons"]);

        this.buttonLikeYes = document.createElement("button");
        this.buttonLikeYes.classList.add("liked-yes");
        likeButtons.appendChild(this.buttonLikeYes);
        this.trackClicks(this.buttonLikeYes, () => {
            this.userDidLikePuzzle = !this.userDidLikePuzzle;
            this.updateLiked();
        });

        const stepRating = makeDiv(this.elemContents, null, ["step", "stepLike"]);
        makeDiv(stepRating, null, ["title"], T.ingame.puzzleCompletion.titleRating);

        const difficultyButtonBar = document.createElement("div");
        difficultyButtonBar.classList.add("buttonBar");
        difficultyButtonBar.id = "difficultyButtonBar";
        this.elemContents.appendChild(difficultyButtonBar);

        this.easyBtn = document.createElement("button");
        this.easyBtn.classList.add("styledButton", "difficultyButton", "easy");
        this.easyBtn.innerText = T.puzzleMenu.difficulties.easy;
        difficultyButtonBar.appendChild(this.easyBtn);
        this.trackClicks(this.easyBtn, () => {
            this.userRatedDifficulty = 0;
            this.updateDifficultyRating("easy");
        });

        this.mediumBtn = document.createElement("button");
        this.mediumBtn.classList.add("styledButton", "difficultyButton", "medium");
        this.mediumBtn.innerText = T.puzzleMenu.difficulties.medium;
        difficultyButtonBar.appendChild(this.mediumBtn);
        this.trackClicks(this.mediumBtn, () => {
            this.userRatedDifficulty = 1;
            this.updateDifficultyRating("medium");
        });

        this.hardBtn = document.createElement("button");
        this.hardBtn.classList.add("styledButton", "difficultyButton", "hard");
        this.hardBtn.innerText = T.puzzleMenu.difficulties.hard;
        difficultyButtonBar.appendChild(this.hardBtn);
        this.trackClicks(this.hardBtn, () => {
            this.userRatedDifficulty = 2;
            this.updateDifficultyRating("hard");
        });

        const buttonBar = document.createElement("div");
        buttonBar.classList.add("buttonBar");
        this.elemContents.appendChild(buttonBar);

        this.continueBtn = document.createElement("button");
        this.continueBtn.classList.add("continue", "styledButton");
        this.continueBtn.innerText = T.ingame.puzzleCompletion.continueBtn;
        buttonBar.appendChild(this.continueBtn);
        this.trackClicks(this.continueBtn, () => {
            this.close(false);
        });

        this.menuBtn = document.createElement("button");
        this.menuBtn.classList.add("menu", "styledButton");
        this.menuBtn.innerText = T.ingame.puzzleCompletion.menuBtn;
        buttonBar.appendChild(this.menuBtn);
        this.trackClicks(this.menuBtn, () => {
            this.close(true);
        });

        const gameMode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        if (gameMode.nextPuzzles.length > 0) {
            this.nextPuzzleBtn = document.createElement("button");
            this.nextPuzzleBtn.classList.add("nextPuzzle", "styledButton");
            this.nextPuzzleBtn.innerText = T.ingame.puzzleCompletion.nextPuzzle;
            buttonBar.appendChild(this.nextPuzzleBtn);

            this.trackClicks(this.nextPuzzleBtn, () => {
                this.nextPuzzle();
            });
        }
    }

    updateLiked() {
        this.buttonLikeYes.classList.toggle("active", this.userDidLikePuzzle === true);
    }

    show() {
        // if the person has already liked the puzzle, it`s shown
        this.metaPuzzle = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode).puzzle.meta;
        this.userDidLikePuzzle = this.metaPuzzle.liked;
        this.updateLiked();

        // if the person has already rated the puzzle, it`s shown
        if (this.metaPuzzle.difficultyRating) {
            this.userRatedDifficulty = difficultyLabels.indexOf(this.metaPuzzle.difficultyRating);
            this.updateDifficultyRating(this.metaPuzzle.difficultyRating);
        }

        this.root.soundProxy.playUi(SOUNDS.levelComplete);
        this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);
        this.visible = true;
        this.timeOfCompletion = this.root.time.now();
    }

    cleanup() {
        this.root.app.inputMgr.makeSureDetached(this.inputReciever);
    }

    /**
     * @param {string} difficulty
     */
    updateDifficultyRating(difficulty) {
        const difficultyButtonBar = this.elemContents.querySelector("#difficultyButtonBar");
        const buttons = difficultyButtonBar.querySelectorAll("button");
        buttons.forEach(button => {
            button.classList.remove("active");
        });
        const button = difficultyButtonBar.querySelector(`.${difficulty}`);
        button.classList.add("active");
    }

    isBlockingOverlay() {
        return this.visible;
    }

    nextPuzzle() {
        const gameMode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        gameMode
            .trackCompleted(
                this.userDidLikePuzzle,
                this.userRatedDifficulty,
                Math.round(this.timeOfCompletion)
            )
            .then(() => {
                this.root.gameState.moveToState("PuzzleMenuState", {
                    continueQueue: gameMode.nextPuzzles,
                });
            });
    }

    close(toMenu) {
        /** @type {PuzzlePlayGameMode} */ (this.root.gameMode)
            .trackCompleted(
                this.userDidLikePuzzle,
                this.userRatedDifficulty,
                Math.round(this.timeOfCompletion)
            )
            .then(() => {
                if (toMenu) {
                    this.root.gameState.moveToState("PuzzleMenuState");
                } else {
                    this.visible = false;
                    this.cleanup();
                }
            });
    }

    update() {
        this.domAttach.update(this.visible);
    }
}
